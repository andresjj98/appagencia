export const mockUsers = [
  {
    id: '1',
    name: 'Ana García',
    email: 'admin@demo.com',
    password: '123456',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    active: true,
    lastLogin: new Date('2025-01-15T10:30:00')
  },
  {
    id: '2',
    name: 'Carlos Mendoza',
    email: 'asesor@demo.com',
    password: '1234567',
    role: 'advisor',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    active: true,
    lastLogin: new Date('2025-01-15T09:15:00')
  },
  {
    id: '3',
    name: 'María López',
    email: 'operario@demo.com',
    password: '123456',
    role: 'manager',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    active: true,
    lastLogin: new Date('2025-01-15T08:45:00')
  }
];

// This will now be managed by the App.js state
export let currentUser = mockUsers[0]; 

// Function to update currentUser (optional, for direct manipulation if needed)
export const setCurrentUser = (user) => {
  currentUser = user;
};