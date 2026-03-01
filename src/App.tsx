/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { FloorList, FloorDetail } from './pages/Floors';
import { RoomDetail } from './pages/RoomDetail';
import { Reports } from './pages/Reports';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="floors" element={<FloorList />} />
            <Route path="floors/:floorId" element={<FloorDetail />} />
            <Route path="rooms/:roomId" element={<RoomDetail />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}
