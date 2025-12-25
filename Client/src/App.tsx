import { useState } from 'react'
import { HashRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import AppSidebar, { SidebarItem } from './components/Sidebar/AppSidebar'
import Accounts from './components/Accounts/Accounts'
import Transactions from "./components/Transactions/Transactions";
import Reports from "./components/Reports/Reports";
import { DataProvider } from './components/DataContext'
import { ReportsStateProvider } from './components/Reports/ReportsStateContext'
import { Home } from './components/Home/Home'

function Layout() {
  const [leftPad, setLeftPad] = useState(240)
  const navigate = useNavigate()
  const location = useLocation()

  const items: SidebarItem[] = [
    { id: 'accounts', label: 'Accounts', icon: 'pi pi-wallet', active: location.pathname === '/accounts', onClick: () => navigate('/accounts') },
    { id: 'tx', label: 'Transactions', icon: 'pi pi-list', active: location.pathname === '/transactions', onClick: () => navigate('/transactions') },
    { id: 'reports', label: 'Reports', icon: 'pi pi-chart-bar', active: location.pathname === '/reports', onClick: () => navigate('/reports') },
    { id: 'backup', label: 'Backup', icon: 'pi pi-cloud-download', active: location.pathname === '/home', onClick: () => navigate('/home') },
  ]

  return (
    <div style={{ paddingLeft: leftPad, transition: 'padding .18s ease' }}>
      <AppSidebar items={items} initialExpanded={true} onWidthChange={setLeftPad} />

      <div className="p-3">
        <Routes>
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/home" element={<Home />} />
          <Route path="*" element={<Navigate to="/accounts" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <DataProvider>
        <ReportsStateProvider>
          <Layout />
        </ReportsStateProvider>
      </DataProvider>
    </Router>
  )
}


