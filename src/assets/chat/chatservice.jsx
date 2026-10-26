
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

function chatsRef(userId) {
  return collection(db, "users", userId, "chats");
}

function messagesRef(userId, chatId) {
  return collection(
    db,
    "users",
    userId,
    "chats",
    chatId,
    "messages"
  );
}

export async function createChat(userId, firstMessage) {
  const chat = await addDoc(chatsRef(userId), {
    title: firstMessage.slice(0, 50) || "New conversation",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return chat.id;
}

export async function saveMessage(userId, chatId, message) {
  await addDoc(messagesRef(userId, chatId), {
    role: message.role,
    content: message.content,
    createdAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, "users", userId, "chats", chatId),
    { updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function getChats(userId) {
  const chatsQuery = query(
    chatsRef(userId),
    orderBy("updatedAt", "desc")
  );

  const snapshot = await getDocs(chatsQuery);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function getChatMessages(userId, chatId) {
  const messagesQuery = query(
    messagesRef(userId, chatId),
    orderBy("createdAt", "asc")
  );

  const snapshot = await getDocs(messagesQuery);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}
