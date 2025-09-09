export const mockReservations = [
  {
    id: 'tmp-1',
    invoiceNumber: null,
    clientName: 'Juan Pérez',
    advisorName: 'Ana López',
    destination: 'Madrid - París',
    departureDate: '2024-07-01',
    returnDate: '2024-07-10',
    totalAmount: 1200,
    status: 'pending',
    createdAt: '2024-05-01',
    changeRequests: [
      {
        id: 1,
        description: 'Cambiar fecha de regreso al 12/07',
        field: 'returnDate',
        value: '2024-07-12'
      }
    ],
    documents: []
  },
  {
    id: 'tmp-2',
    invoiceNumber: 1000,
    clientName: 'María Gómez',
    advisorName: 'Luis Álvarez',
    destination: 'Lima - Cusco',
    departureDate: '2024-06-15',
    returnDate: '2024-06-20',
    totalAmount: 800,
    status: 'confirmed',
    createdAt: '2024-04-20',
    changeRequests: [],
    documents: []
  }
];

export default mockReservations;