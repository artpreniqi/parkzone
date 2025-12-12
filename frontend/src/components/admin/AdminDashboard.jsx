import { useEffect, useState } from 'react'
import AdminZones from './AdminZones'
import AdminCard from './AdminCard'

export default function AdminDashboard({ apiRequest, authToken, showMessage }) {
  const [stats, setStats] = useState(null)
  const [latest, setLatest] = useState([])
  const [loading, setLoading] = useState(false)
  const [latestReservations, setLatestReservations] = useState([])

  async function load() {
    if (!authToken) return
    try {
      setLoading(true)
      const s = await apiRequest('/admin/stats', { token: authToken })
      const r = await apiRequest('/admin/reservations?limit=10', { token: authToken })
      setStats(s)
      setLatest(r)
    } catch (err) {
      showMessage(err.message, 'danger')
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    try {
        const data = await apiRequest('/admin/stats', { token: authToken })
        setStats(data)
    } catch (err) {
        showMessage(err.message, 'danger')
    }
    }

    async function loadLatestReservations() {
    try {
        const data = await apiRequest('/admin/reservations?limit=8', { token: authToken })
        setLatestReservations(data)
    } catch (err) {
        showMessage(err.message, 'danger')
    }
    }


  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
  loadStats()
  loadLatestReservations()
  // eslint-disable-next-line
    }, [])


  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="section-title mb-0">
          <i className="bi bi-speedometer2 me-2"></i> Admin Dashboard
        </h3>

        <button className="btn btn-outline-light btn-sm" onClick={load}>
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh
        </button>
      </div>

      <div className="row g-4 mb-4">
        <AdminCard title="Users" value={stats?.users} icon="people" />
        <AdminCard title="Vehicles" value={stats?.vehicles} icon="car-front" />
        <AdminCard title="Zones" value={stats?.zones} icon="geo-alt" />
        <AdminCard title="Active" value={stats?.activeReservations} icon="calendar-check" color="success" />
        <AdminCard title="Expired" value={stats?.expiredReservations} icon="calendar-x" color="danger" />
      </div>

        <AdminZones apiRequest={apiRequest} authToken={authToken} showMessage={showMessage} />      

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>
            <i className="bi bi-clock-history me-1"></i> Latest Reservations
          </span>
          {loading && <span className="text-secondary small">Loading...</span>}
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-dark-custom table-striped align-middle">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Zone</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th>Start</th>
                </tr>
              </thead>
              <tbody>
                {latest.map((r) => (
                  <tr key={r.id}>
                    <td>{r.User?.email}</td>
                    <td>{r.ParkingZone?.name}</td>
                    <td>{r.Vehicle?.plate_number}</td>
                    <td>
                      <span className={'badge bg-' + (r.status === 'ACTIVE' ? 'success' : 'danger')}>
                        {r.status}
                      </span>
                    </td>
                    <td>{new Date(r.start_time).toLocaleString()}</td>
                  </tr>
                ))}
                {latest.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" className="text-secondary">
                      Nuk ka rezervime për momentin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
