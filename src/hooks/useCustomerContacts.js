import { useState, useCallback, useEffect } from 'react';

// Mock global state for contacts to persist across component mounts during session
let mockContacts = [
  { id: 'c1', customer_id: 'mock-1', full_name: 'สมชาย ใจดี', role: 'ผู้จัดการทั่วไป', email: 'somchai@example.com', phone: '081-234-5678', is_primary: true },
  { id: 'c2', customer_id: 'mock-1', full_name: 'วิภา มั่นคง', role: 'ฝ่ายจัดซื้อ', email: 'wipa@example.com', phone: '089-876-5432', is_primary: false }
];

export function useCustomerContacts(customerId) {
  const [contacts, setContacts] = useState([]);

  const refresh = useCallback(() => {
    if (customerId) {
      setContacts(mockContacts.filter(c => c.customer_id === customerId));
    } else {
      setContacts([]);
    }
  }, [customerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addContact = useCallback((contact) => {
    const newContact = { ...contact, id: Date.now().toString(), customer_id: customerId };
    if (newContact.is_primary) {
      mockContacts = mockContacts.map(c => c.customer_id === customerId ? { ...c, is_primary: false } : c);
    }
    mockContacts.push(newContact);
    refresh();
  }, [customerId, refresh]);

  const updateContact = useCallback((id, updates) => {
    if (updates.is_primary) {
      mockContacts = mockContacts.map(c => c.customer_id === customerId ? { ...c, is_primary: false } : c);
    }
    mockContacts = mockContacts.map(c => c.id === id ? { ...c, ...updates } : c);
    refresh();
  }, [customerId, refresh]);

  const deleteContact = useCallback((id) => {
    mockContacts = mockContacts.filter(c => c.id !== id);
    refresh();
  }, [refresh]);

  return { contacts, addContact, updateContact, deleteContact };
}
