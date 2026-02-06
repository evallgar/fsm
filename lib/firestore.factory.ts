/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  QueryConstraint,
  DocumentData,
  Firestore,
  getDoc,
  where,
  FirestoreDataConverter,
  WithFieldValue,
  QueryDocumentSnapshot,
  getCountFromServer,
  orderBy,
  limit,
} from 'firebase/firestore'


/**
 * Creates a Firestore converter that handles date fields dynamically
 * @param dateFields Array of field names that should be converted between Date and ISO string
 */
function createFirestoreConverter<T extends DocumentData>(dateFields: string[]): FirestoreDataConverter<T> {
  return {
    toFirestore(data: WithFieldValue<T>): DocumentData {
      const result: DocumentData = { ...data };
      dateFields.forEach(field => {
        // eslint-disable-next-line no-console
        console.log("field", field)
        // Skip conversion for system fields on write
        if (field === 'createdAt' || field === 'lastUpdatedAt' || field === 'deletedAt') return;
        if (result[field] && typeof result[field] === 'string') {
          result[field] = new Date(result[field]);
        }
      });
      return result;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      const data = snapshot.data();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = { ...data, id: snapshot.id };
      dateFields.forEach(field => {
        try {
          // Handle all possible date scenarios
          if (data[field] === null || data[field] === undefined) {
            result[field] = null;
          } else if (data[field]?.toDate) { // Firestore Timestamp
            result[field] = data[field].toDate();
          } else if (data[field] instanceof Date) { // JS Date
            result[field] = data[field];
          } else if (typeof data[field] === 'string') { // Already ISO string
            result[field] = data[field];
          }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          // eslint-disable-next-line no-console
          console.warn(`Failed to convert date field ${field}:`, data[field]);
          result[field] = null;
        }
      });
      return result as T;
    }
  };
}


/**
 * Creates a CRUD service for a Firestore collection
 * @param db Firestore instance
 * @param collectionName Name of the collection
 * @returns CRUD operations for the collection
 */
export function createFirestoreCRUD<T extends DocumentData>(
  db: Firestore,
  collectionName: string,
  dateFields: string[] = []
) {
  const converter = createFirestoreConverter<T>(dateFields);
  // eslint-disable-next-line no-console
  console.log("date fields", dateFields)
  const collectionRef = collection(db, collectionName).withConverter(converter);

  return {
    /**
     * Creates a new document in the collection
     * @param data Document data to create
     * @returns Promise with the created document reference
     */
    create: async (data: Omit<T, 'id'>): Promise<T & { id: string }> => {
      const docRef = await addDoc(collectionRef, data)
      return { id: docRef.id, ...data } as T & { id: string }
    },

    /**
     * Lists all documents in the collection
     * that are not soft deleted
     * @param filters Optional query constraints
     * @returns Promise with array of documents
     */
    list: async (
      filters?: QueryConstraint[]
    ): Promise<(T & { id: string })[]> => {

      // Soft listings will always exclude soft deleted documents
      const baseFilters = [where('deleted', '==', false)]; // [where('active', '==', true)];
      
      // If filters are provided, apply them to the base query
      const q = filters
        ? query(collectionRef, ...filters, ...baseFilters)
        : query(collectionRef, ...baseFilters);
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as T & { id: string }
      )
    },

    /**
     * Lists the latest documents in the collection
     * that are not soft deleted
     * @param filters Optional query constraints
     * @param limit Optional limit of documents to return
     * @param orderBy Optional field to order by
     * @returns Promise with array of documents
     */
    latest: async (
      filters?: QueryConstraint[],
      docLimit: number = 10000,
      orderByField: string = 'date',
      order: 'asc' | 'desc' = 'desc'
    ): Promise<(T & { id: string })[]> => {
      const q = filters
        ? query(collectionRef, ...filters, orderBy(orderByField, order), limit(docLimit))
        : query(collectionRef, orderBy(orderByField, order), limit(docLimit))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as T & { id: string }
      )
    },

    /**
     * Lists all documents in the collection
     * including soft deleted documents
     * @param filters Optional query constraints
     * @returns Promise with array of documents
     */
    hardList: async (
      filters?: QueryConstraint[]
    ): Promise<(T & { id: string })[]> => {
      const q = filters
        ? query(collectionRef, ...filters)
        : query(collectionRef)
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as T & { id: string }
      )
    },

    /**
     * Gets a single document by ID
     * @param id Document ID
     * @returns Promise with the document or undefined if not found
     */
    get: async (id: string): Promise<(T & { id: string }) | undefined> => {
      const docRef = doc(db, collectionName, id).withConverter(converter);
      const docSnap = await getDoc(docRef)
      return docSnap.exists()
        ? ({ id: docSnap.id, ...docSnap.data() } as T & { id: string })
        : undefined
    },

    /**
     * Gets the count of documents in the collection
     * @returns Promise with the count of documents
     */
    getCount: async (): Promise<number> => {
      const q = query(collectionRef)
      const querySnapshot = await getCountFromServer(q)
      return querySnapshot.data().count
    },

    /**
     * Updates a document in the collection
     * @param id Document ID to update
     * @param data Partial document data to update
     * @returns Promise that resolves when update is complete
     */
    update: async (id: string, data: Partial<T>): Promise<void> => {
      const docRef = doc(db, collectionName, id).withConverter(converter)
      // Using a properly typed approach for updateDoc
      return await updateDoc(docRef, data as Partial<DocumentData>)
    },

    /**
     * Deletes a document from the collection
     * @param id Document ID to delete
     * @returns Promise that resolves when deletion is complete
     */
    delete: async (id: string): Promise<void> => {
      const docRef = doc(db, collectionName, id).withConverter(converter)
      return await deleteDoc(docRef)
    },

    /**
     * Soft deletes a document from the collection
     * @param id Document ID to delete
     * @returns Promise that resolves when deletion is complete
     */
    softDelete: async (id: string): Promise<void> => {
      const docRef = doc(db, collectionName, id).withConverter(converter)
      return await updateDoc(docRef, { deleted: true, deletedAt: new Date() })
    },

    /**
     * Soft undeletes a document from the collection
     * @param id Document ID to undelete
     * @returns Promise that resolves when undeletion is complete
     */
    softUndelete: async (id: string): Promise<void> => {
      const docRef = doc(db, collectionName, id).withConverter(converter)
      return await updateDoc(docRef, { deleted: false, lastUpdatedAt: new Date() })
    }
  }
}
