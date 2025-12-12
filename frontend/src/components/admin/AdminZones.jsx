import { useEffect, useState } from 'react'

export default function AdminZones({ apiRequest, authToken, showMessage }) {
  const [zones, setZones] = useState([])
  const [editingId, setEditingId] = useState(null)

  const [newZone, setNewZone] = useState({
  name: '',
  location: '',
  total_spots: 10,
})

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL | ACTIVE | INACTIVE


  async function loadZones() {
    try {
      const res = await apiRequest('/zones', { token: authToken })
      setZones(res.zones || res)
    } catch (err) {
      showMessage(err.message, 'danger')
    }
  }

  useEffect(() => {
    loadZones()
    // eslint-disable-next-line
  }, [])

  function updateLocal(id, patch) {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...patch } : z)))
  }

  async function saveZone(zone) {
    try {
      await apiRequest(`/zones/${zone.id}`, {
        method: 'PUT',
        token: authToken,
        body: {
          name: zone.name,
          location: zone.location,
          total_spots: zone.total_spots,
          status: zone.status,
        },
      })

      showMessage('Zona u përditësua', 'success')
      setEditingId(null)
      loadZones()
    } catch (err) {
      showMessage(err.message, 'danger')
    }
  }

  async function toggleStatus(zone) {
    await saveZone({
      ...zone,
      status: zone.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
    })
  }

  async function createZone() {
  try {
    if (!newZone.name || !newZone.total_spots) {
      showMessage('Emri dhe totali janë të detyrueshme', 'warning')
      return
    }

    await apiRequest('/zones', {
      method: 'POST',
      token: authToken,
      body: {
        name: newZone.name,
        location: newZone.location,
        total_spots: Number(newZone.total_spots),
      },
    })

    showMessage('Zona u krijua me sukses', 'success')
    setNewZone({ name: '', location: '', total_spots: 10 })
    loadZones()
  } catch (err) {
    showMessage(err.message, 'danger')
  }
}

    const filteredZones = zones.filter((z) => {
    const text = `${z.name || ''} ${z.location || ''}`.toLowerCase()
    const matchesSearch = text.includes(search.toLowerCase())

    const st = (z.status || 'ACTIVE')
    const matchesStatus = statusFilter === 'ALL' ? true : st === statusFilter

    return matchesSearch && matchesStatus
    })

  return (
    <div className="card mt-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <span>
          <i className="bi bi-geo-alt-fill me-1"></i> Zone Management
        </span>
        <button className="btn btn-outline-light btn-sm" onClick={loadZones}>
          <i className="bi bi-arrow-clockwise"></i>
        </button>
        <span className="text-secondary small">
        {filteredZones.length}/{zones.length}
        </span>
      </div>

      <div className="card-body">
        <div className="mb-4">
            <h6 className="mb-3">
                <i className="bi bi-plus-circle me-1 text-success"></i> Shto zonë të re
            </h6>

            <div className="row g-2 align-items-end mb-3">
                <div className="col-md-6">
                    <label className="form-label">Kërko (name/location)</label>
                    <input
                    className="form-control"
                    placeholder="p.sh. Qendra, Lagjja A..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="col-md-3">
                    <label className="form-label">Filtro statusin</label>
                    <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    >
                    <option value="ALL">ALL</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    </select>
                </div>

                <div className="col-md-3">
                    <button
                    className="btn btn-outline-light w-100"
                    onClick={() => {
                        setSearch('')
                        setStatusFilter('ALL')
                    }}
                    >
                    <i className="bi bi-x-circle me-1"></i> Reset
                    </button>
                </div>
            </div>


            <div className="row g-2 align-items-end">
                <div className="col-md-4">
                <label className="form-label">Emri</label>
                <input
                    className="form-control"
                    value={newZone.name}
                    onChange={(e) =>
                    setNewZone((z) => ({ ...z, name: e.target.value }))
                    }
                />
                </div>

                <div className="col-md-4">
                <label className="form-label">Lokacioni</label>
                <input
                    className="form-control"
                    value={newZone.location}
                    onChange={(e) =>
                    setNewZone((z) => ({ ...z, location: e.target.value }))
                    }
                />
                </div>

                <div className="col-md-2">
                <label className="form-label">Total</label>
                <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={newZone.total_spots}
                    onChange={(e) =>
                    setNewZone((z) => ({ ...z, total_spots: e.target.value }))
                    }
                />
                </div>

                <div className="col-md-2">
                <button className="btn btn-success w-100" onClick={createZone}>
                    <i className="bi bi-check-circle me-1"></i> Krijo
                </button>
                </div>
            </div>
            </div>

            <hr className="my-4" />

        <div className="table-responsive">
          <table className="table table-dark-custom table-striped align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Emri</th>
                <th>Lokacioni</th>
                <th>Total</th>
                <th>Status</th>
                <th>Free</th>
                <th style={{ width: 160 }}>Veprime</th>
              </tr>
            </thead>

            <tbody>
              {filteredZones.map((z) => (
                <tr key={z.id}>
                  <td>{z.id}</td>

                  <td>
                    {editingId === z.id ? (
                      <input
                        className="form-control form-control-sm"
                        value={z.name}
                        onChange={(e) => updateLocal(z.id, { name: e.target.value })}
                      />
                    ) : (
                      z.name
                    )}
                  </td>

                  <td>
                    {editingId === z.id ? (
                      <input
                        className="form-control form-control-sm"
                        value={z.location || ''}
                        onChange={(e) => updateLocal(z.id, { location: e.target.value })}
                      />
                    ) : (
                      z.location || ''
                    )}
                  </td>

                  <td>
                    {editingId === z.id ? (
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={z.total_spots}
                        onChange={(e) =>
                          updateLocal(z.id, { total_spots: Number(e.target.value) })
                        }
                      />
                    ) : (
                      z.total_spots
                    )}
                  </td>

                  <td>
                    <span className={'badge bg-' + ((z.status || 'ACTIVE') === 'ACTIVE' ? 'success' : 'danger')}>
                        {z.status || 'ACTIVE'}
                    </span>
                    </td>

                    <td>
                    <span className="badge bg-info">
                        {z.free_spots ?? '-'}
                    </span>
                    </td>


                  <td className="d-flex gap-2">
                    {editingId === z.id ? (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => saveZone(z)}>
                          <i className="bi bi-check"></i>
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>
                          <i className="bi bi-x"></i>
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-outline-primary btn-sm" onClick={() => setEditingId(z.id)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-outline-warning btn-sm" onClick={() => toggleStatus(z)}>
                          <i className={'bi ' + (z.status === 'ACTIVE' ? 'bi-power' : 'bi-power text-danger')}></i>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}

              {filteredZones.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-secondary">
                    Nuk ka zona.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="small text-secondary mb-0">
          <i className="bi bi-info-circle me-1"></i>
          Admin mundet me i aktivizu/çaktivizu zonat dhe me i editu.
        </p>
      </div>
    </div>
  )
}
