
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const memoryCollection = (userId) =>
  collection(db, "users", userId, "memories");

export async function saveMemory(userId, text, source = "automatic") {
  const cleanText = text.trim();

  if (!cleanText) return;

  const existing = await getDocs(memoryCollection(userId));

  const duplicate = existing.docs.find(
    (item) =>
      item.data().text.toLowerCase() === cleanText.toLowerCase()
  );

  if (duplicate) return duplicate.id;

  const memory = await addDoc(memoryCollection(userId), {
    text: cleanText,
    source,
    createdAt: serverTimestamp(),
  });

  return memory.id;
}

export async function getMemories(userId) {
  const memoriesQuery = query(
    memoryCollection(userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(memoriesQuery);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function deleteMemory(userId, memoryId) {
  await deleteDoc(
    doc(db, "users", userId, "memories", memoryId)
  );
}
