import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { GuestBookingPage } from '../pages/GuestBookingPage';
import { GuestEventTypesPage } from '../pages/GuestEventTypesPage';
import { OwnerBookingsPage } from '../pages/OwnerBookingsPage';
import { OwnerEventTypesPage } from '../pages/OwnerEventTypesPage';
import { AppLayout } from '../shared/ui/AppLayout';

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <GuestEventTypesPage />,
      },
      {
        path: '/event-types/:id',
        element: <GuestBookingPage />,
      },
      {
        path: '/owner/event-types',
        element: <OwnerEventTypesPage />,
      },
      {
        path: '/owner/bookings',
        element: <OwnerBookingsPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
