import { useEffect, useState } from 'react'
import './App.css'

const API_BASE = 'http://localhost:4000/api/v1'

async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Error ${res.status}: ${text}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return res.json()
  return res.text()
}

function App() {
  const [activeSection, setActiveSection] = useState('auth') // 'auth' | 'zones' | 'vehicles' | 'reservations'
  const [apiStatus, setApiStatus] = useState('checking') // 'checking' | 'online' | 'offline'

  const [authToken, setAuthToken] = useState(null)
  const [currentUser, setCurrentUser] = useState(null) // { email, role }
  const [theme, setTheme] = useState('light') // 'light' ose 'dark'

  // theme switch (light/dark)
  useEffect(() => {
    document.body.classList.remove('light-theme', 'dark-theme')
    document.body.classList.add(theme === 'light' ? 'light-theme' : 'dark-theme')
  }, [theme])

  // auto-login nga localStorage nese ekziston token
  useEffect(() => {
    const savedToken = localStorage.getItem('parkzoneToken')
    if (savedToken) {
      setAuthToken(savedToken)
      fetchMe(savedToken)
      setActiveSection('zones')
    }
  }, [])

  // forms
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: '',
    roleName: 'RESIDENT',
  })

  const [showRegister, setShowRegister] = useState(false)

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })

  const [zoneForm, setZoneForm] = useState({
    name: '',
    location: '',
    total_spots: 10,
  })

  const [reservationForm, setReservationForm] = useState({
    zoneId: '',
    vehicleId: '',
    start_date: '',
    start_time_simple: '',
    end_date: '',
    end_time_simple: '',
  })

  const [vehicleForm, setVehicleForm] = useState({
    plate_number: '',
    model: '',
    color: '',
  })

  // data lists
  const [zones, setZones] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [reservations, setReservations] = useState([])

  // messages
  const [message, setMessage] = useState({ text: '', type: 'success', visible: false })

  function showMessage(text, type = 'success') {
    setMessage({ text, type, visible: true })
    setTimeout(() => setMessage((m) => ({ ...m, visible: false })), 4000)
  }

  async function checkApi() {
    try {
      const res = await fetch('http://localhost:4000/')
      if (res.ok) setApiStatus('online')
      else setApiStatus('offline')
    } catch {
      setApiStatus('offline')
    }
  }

  useEffect(() => {
    checkApi()
  }, [])

  async function fetchMe(token) {
    try {
      const user = await apiRequest('/users/me', { method: 'GET', token })
      setCurrentUser({
        email: user.email,
        role: user.Role?.name || 'UNKNOWN',
      })
    } catch (err) {
      console.warn('Could not fetch /users/me', err)
    }
  }

  // -------- AUTH --------
  async function handleRegister() {
    try {
      const { name, email, password, roleName } = regForm
      if (!name || !email || !password) {
        showMessage('Ju lutem plotësoni të gjitha fushat e regjistrimit', 'warning')
        return
      }

      await apiRequest('/auth/register', {
        method: 'POST',
        body: { name, email, password, roleName },
      })

      showMessage('Regjistrimi u kry me sukses', 'success')
    } catch (err) {
      showMessage(err.message, 'danger')
    }
  }

  async function handleLogin() {
    try {
      const { email, password } = loginForm
      if (!email || !password) {
        showMessage('Ju lutem shtypni email dhe fjalëkalim', 'warning')
        return
      }

      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password },
      })

      // ruaj tokenin ne state + localStorage
      setAuthToken(data.token)
      localStorage.setItem('parkzoneToken', data.token)

      await fetchMe(data.token)
      showMessage('Login i suksesshëm', 'success')
      setActiveSection('zones')
      loadZones(data.token)
    } catch (err) {
      showMessage(err.message, 'danger')
    }
  }

  function logout() {
    setAuthToken(null)
    setCurrentUser(null)
    localStorage.removeItem('parkzoneToken')
    showMessage('U çkyçe', 'info')
    setActiveSection('auth')
  }

  // -------- ZONES --------
  async function loadZones(token = authToken) {
    try {
      const data = await apiRequest('/zones', { method: 'GET', token })
      setZones(data)
    } catch (err) {
      showMessage(err.message, 'danger')
    }
  }

  async function createZone() {
    if (!authToken) {
      showMessage('Duhet të jesh i kyçur si ADMIN', 'warning')
      return
    }
    try {
      const { name, location, total_spots } = zoneForm
      if (!name || !total_spots) {
        showMessage('Emri dhe totali i vendeve janë të detyrueshëm', 'warning')
        return
      }
      await apiRequest('/zones', {
        method: 'POST',
        body: { name, location, total_spots: Number(total_spots) },
        token: authToken,
      })
      showMessage('Zona u krijua me sukses', 'success')
      loadZones()
    } catch (err) {
      showMessage(err.message, 'danger')
    }
  }

  // -------- VEHICLES --------
  async function loadVehicles() {
    if (!authToken) {
      showMessage('Duhet të jesh i kyçur', 'warning')
      return
    }
    try {
      const data = await apiRequest('/vehicles', { method: 'GET', token: authToken })
      setVehicles(data)
    } catch (err) {
      showMessage(err.message, 'danger')
    }
  }

  async function addVehicle() {
    if (!authToken) {
      showMessage('Duhet të jesh i kyçur', 'warning')
      return
    }
    try {
      const { plate_number, model, color } = vehicleForm
      if (!plate_number) {
        showMessage('Targa është e detyrueshme', 'warning')
        return
      }
      await apiRequest('/vehicles', {
        method: 'POST',
        body: { plate_number, model, color },
        token: authToken,
      })
      showMessage('Veturë u shtua me sukses', 'success')
      loadVehicles()
    } catch (err) {
      showMessage(err.message, 'danger')
    }
  }

  // -------- RESERVATIONS --------
  async function createReservation() {
    if (!authToken) {
      showMessage('Duhet të jesh i kyçur', 'warning')
      return
    }
    try {
      const {
        zoneId,
        vehicleId,
        start_date,
        start_time_simple,
        end_date,
        end_time_simple,
      } = reservationForm

      if (
        !zoneId ||
        !vehicleId ||
        !start_date ||
        !start_time_simple ||
        !end_date ||
        !end_time_simple
      ) {
        showMessage('Plotëso të gjitha fushat e rezervimit', 'warning')
        return
      }

      const startISO = new Date(`${start_date}T${start_time_simple}`).toISOString()
      const endISO = new Date(`${end_date}T${end_time_simple}`).toISOString()

      await apiRequest('/reservations', {
        method: 'POST',
        body: {
          zoneId: Number(zoneId),
          vehicleId: Number(vehicleId),
          start_time: startISO,
          end_time: endISO,
        },
        token: authToken,
      })
      showMessage('Rezervimi u krijua me sukses', 'success')
      loadMyReservations()
    } catch (err) {
      showMessage(err.message, 'danger')
    }
  }

  async function loadMyReservations() {
    if (!authToken) {
      showMessage('Duhet të jesh i kyçur', 'warning')
      return
    }
    try {
      const data = await apiRequest('/reservations/my', {
        method: 'GET',
        token: authToken,
      })
      setReservations(data)
    } catch (err) {
      showMessage(err.message, 'danger')
    }
  }

  // helpers
  const userLabel = currentUser
    ? (
        <>
          <i className="bi bi-circle-fill text-success me-1"></i>
          {currentUser.email}
          <span className="badge-role ms-2">{currentUser.role}</span>
        </>
      )
    : (
        <>
          <i className="bi bi-circle text-danger me-1"></i> Guest
        </>
      )

  const apiStatusLabel =
    apiStatus === 'online' ? (
      <>
        <i className="bi bi-circle-fill text-success me-1"></i> Shërbimi aktiv
      </>
    ) : apiStatus === 'offline' ? (
      <>
        <i className="bi bi-circle-fill text-danger me-1"></i> Shërbimi i padisponueshëm
      </>
    ) : (
      <>
        <i className="bi bi-circle-fill text-warning me-1"></i> Duke verifikuar statusin...
      </>
    )

  const isAdmin = currentUser?.role === 'ADMIN'

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-transparent py-3">
        <div className="container content-wrapper">
          <a className="navbar-brand d-flex align-items-center" href="#">
            <img
              src="/parkzone-logo.png"
              alt="ParkZone"
              height="26"
              className="me-2"
              style={{ borderRadius: '6px' }}
            />
            ParkZone
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item mx-2">
                <button
                  className={
                    'nav-link btn btn-link p-0 ' +
                    (activeSection === 'auth' ? 'active-section' : '')
                  }
                  onClick={() => setActiveSection('auth')}
                >
                  <i className="bi bi-person-lines-fill me-1"></i> Auth
                </button>
              </li>
              <li className="nav-item mx-2">
                <button
                  className={
                    'nav-link btn btn-link p-0 ' +
                    (activeSection === 'zones' ? 'active-section' : '')
                  }
                  onClick={() => {
                    setActiveSection('zones')
                    loadZones()
                  }}
                >
                  <i className="bi bi-geo-alt-fill me-1"></i> Zones
                </button>
              </li>
              <li className="nav-item mx-2">
                <button
                  className={
                    'nav-link btn btn-link p-0 ' +
                    (activeSection === 'vehicles' ? 'active-section' : '')
                  }
                  onClick={() => {
                    setActiveSection('vehicles')
                    loadVehicles()
                  }}
                >
                  <i className="bi bi-car-front-fill me-1"></i> Vehicles
                </button>
              </li>
              <li className="nav-item mx-2">
                <button
                  className={
                    'nav-link btn btn-link p-0 ' +
                    (activeSection === 'reservations' ? 'active-section' : '')
                  }
                  onClick={() => {
                    setActiveSection('reservations')
                    loadMyReservations()
                  }}
                >
                  <i className="bi bi-calendar-check me-1"></i> Reservations
                </button>
              </li>
            </ul>
            <div className="d-flex align-items-center gap-3">
              <span id="currentUserLabel" className="text-sm">
                {userLabel}
              </span>

              <button
                className="btn btn-outline-light btn-sm"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              >
                {theme === 'light' ? (
                  <>
                    <i className="bi bi-moon-stars me-1"></i> Dark
                  </>
                ) : (
                  <>
                    <i className="bi bi-sun-fill me-1"></i> Light
                  </>
                )}
              </button>

              {currentUser ? (
                <button className="btn btn-outline-light btn-sm" onClick={logout}>
                  <i className="bi bi-box-arrow-right me-1"></i> Logout
                </button>
              ) : (
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={() => setActiveSection('auth')}
                >
                  <i className="bi bi-box-arrow-in-right me-1"></i> Kyçu
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container content-wrapper pb-5">
        <div className="glass mb-4 mt-2">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h2 className="mb-2">
                Mirësevjen në <span className="text-success">ParkZone</span>
              </h2>
              <p className="mb-2 text-secondary">
                Rezervo vend parkimi, menaxho veturat dhe shiko zonat e lira në lagjen tënde - gjithçka nga një panel i vetëm.
              </p>
              <div className="d-flex flex-wrap gap-2 mt-2">
                <span className="badge bg-success bg-gradient">Rezervim i shpejtë i parkimit</span>
                <span className="badge bg-info bg-gradient">Menaxhim i zonave në lagje</span>
                <span className="badge bg-primary bg-gradient">Panel i thjeshtë për banorë</span>
              </div>
            </div>
            <div className="col-md-4 text-md-end mt-3 mt-md-0">
              <div className="small text-secondary">Status:</div>
              <div id="apiStatus" className="fw-semibold api-status">
                {apiStatusLabel}
              </div>
            </div>
          </div>
        </div>

        {message.visible && (
          <div
            className={`alert alert-${message.type}`}
            role="alert"
          >
            {message.text}
          </div>
        )}

        {/* AUTH */}
        {activeSection === 'auth' && (
          <>
            {!currentUser ? (
              // NUK je i kyçur
              <div className="row g-4">
                <div className="col-md-6 mx-auto">
                  <div className="card h-100">
                    <div className="card-header">
                      {showRegister ? (
                        <>
                          <i className="bi bi-person-plus-fill me-1 text-success"></i>
                          Regjistrim
                        </>
                      ) : (
                        <>
                          <i className="bi bi-box-arrow-in-right me-1 text-info"></i>
                          Kyçja (Login)
                        </>
                      )}
                    </div>
                    <div className="card-body">
                      {showRegister ? (
                        <>
                          <div className="mb-3">
                            <label className="form-label">Emri</label>
                            <input
                              className="form-control"
                              value={regForm.name}
                              onChange={(e) =>
                                setRegForm((f) => ({ ...f, name: e.target.value }))
                              }
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Email</label>
                            <input
                              className="form-control"
                              type="email"
                              value={regForm.email}
                              onChange={(e) =>
                                setRegForm((f) => ({ ...f, email: e.target.value }))
                              }
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Fjalëkalimi</label>
                            <input
                              className="form-control"
                              type="password"
                              value={regForm.password}
                              onChange={(e) =>
                                setRegForm((f) => ({ ...f, password: e.target.value }))
                              }
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Roli</label>
                            <select
                              className="form-select"
                              value={regForm.roleName}
                              onChange={(e) =>
                                setRegForm((f) => ({ ...f, roleName: e.target.value }))
                              }
                            >
                              <option value="RESIDENT">RESIDENT</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="VISITOR">VISITOR</option>
                            </select>
                          </div>
                          <button className="btn btn-primary w-100" onClick={handleRegister}>
                            Regjistrohu
                          </button>

                          <p className="mt-3 text-secondary small text-center">
                            Ke llogari?
                            <button
                              type="button"
                              className="btn btn-link p-0 ms-1 align-baseline"
                              onClick={() => setShowRegister(false)}
                            >
                              Kyçu këtu
                            </button>
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="mb-3">
                            <label className="form-label">Email</label>
                            <input
                              className="form-control"
                              type="email"
                              value={loginForm.email}
                              onChange={(e) =>
                                setLoginForm((f) => ({ ...f, email: e.target.value }))
                              }
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Fjalëkalimi</label>
                            <input
                              className="form-control"
                              type="password"
                              value={loginForm.password}
                              onChange={(e) =>
                                setLoginForm((f) => ({ ...f, password: e.target.value }))
                              }
                            />
                          </div>
                          <button className="btn btn-success w-100" onClick={handleLogin}>
                            Kyçu
                          </button>
                          <p className="mt-3 text-secondary small text-center">
                            Nuk ke llogari?
                            <button
                              type="button"
                              className="btn btn-link p-0 ms-1 align-baseline"
                              onClick={() => setShowRegister(true)}
                            >
                              Regjistrohu këtu
                            </button>
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // JE i kyçur
              <div className="row g-4">
                <div className="col-md-8">
                  <div className="card">
                    <div className="card-header">
                      <i className="bi bi-person-check-fill me-1 text-success"></i>
                      Profili i përdoruesit
                    </div>
                    <div className="card-body">
                      <p className="mb-1">
                        <strong>Email:</strong> {currentUser.email}
                      </p>
                      <p className="mb-3">
                        <strong>Roli:</strong> {currentUser.role}
                      </p>
                      <p className="text-secondary small mb-3">
                        Jeni i kyçur në sistem. Mund të menaxhoni zonat, veturat dhe
                        rezervimet duke përdorur menunë lart.
                      </p>
                      <button
                        className="btn btn-primary me-2"
                        onClick={() => setActiveSection('zones')}
                      >
                        Shko te zonat e parkimit
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={logout}
                      >
                        <i className="bi bi-box-arrow-right me-1"></i> Çkyçu
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}


        {/* ZONES */}
        {activeSection === 'zones' && (
          <>
            <div className="row g-4">
              <div className="col-md-8">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <span>
                      <i className="bi bi-geo-alt-fill me-1 text-warning"></i> Zonat e parkimit
                    </span>
                    <button
                      className="btn btn-outline-light btn-sm"
                      onClick={() => loadZones()}
                    >
                      <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-dark-custom table-striped table-hover align-middle">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Emri</th>
                            <th>Lokacioni</th>
                            <th>Tot. vendet</th>
                          </tr>
                        </thead>
                        <tbody>
                          {zones.map((z) => (
                            <tr key={z.id}>
                              <td>{z.id}</td>
                              <td>{z.name}</td>
                              <td>{z.location || ''}</td>
                              <td>{z.total_spots}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-secondary small mb-0">
                      <i className="bi bi-info-circle me-1"></i> Si RESIDENT mund të bësh
                      rezervim nëpër këto zona.
                    </p>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="col-md-4">
                  <div className="card">
                    <div className="card-header">
                      <i className="bi bi-plus-circle me-1 text-success"></i>
                      Shto zonë të re (ADMIN)
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label">Emri i zonës</label>
                        <input
                          className="form-control"
                          value={zoneForm.name}
                          onChange={(e) =>
                            setZoneForm((f) => ({ ...f, name: e.target.value }))
                          }
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Lokacioni</label>
                        <input
                          className="form-control"
                          value={zoneForm.location}
                          onChange={(e) =>
                            setZoneForm((f) => ({ ...f, location: e.target.value }))
                          }
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Totali i vendeve</label>
                        <input
                          type="number"
                          className="form-control"
                          value={zoneForm.total_spots}
                          onChange={(e) =>
                            setZoneForm((f) => ({
                              ...f,
                              total_spots: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <button className="btn btn-primary w-100" onClick={createZone}>
                        Ruaj zonën
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card mt-4">
              <div className="card-header">
                <i className="bi bi-calendar-plus me-1 text-success"></i>
                Krijo rezervim të ri
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">Zone ID</label>
                    <input
                      className="form-control"
                      value={reservationForm.zoneId}
                      onChange={(e) =>
                        setReservationForm((f) => ({ ...f, zoneId: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Vehicle ID</label>
                    <input
                      className="form-control"
                      value={reservationForm.vehicleId}
                      onChange={(e) =>
                        setReservationForm((f) => ({ ...f, vehicleId: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      onChange={(e) =>
                        setReservationForm((f) => ({ ...f, start_date: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Start Time</label>
                    <input
                      type="time"
                      className="form-control"
                      onChange={(e) =>
                        setReservationForm((f) => ({ ...f, start_time_simple: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      onChange={(e) =>
                        setReservationForm((f) => ({ ...f, end_date: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">End Time</label>
                    <input
                      type="time"
                      className="form-control"
                      onChange={(e) =>
                        setReservationForm((f) => ({ ...f, end_time_simple: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <button
                  className="btn btn-primary mt-3"
                  onClick={createReservation}
                >
                  Konfirmo rezervimin
                </button>
              </div>
            </div>
          </>
        )}

        {/* VEHICLES */}
        {activeSection === 'vehicles' && (
          <div className="row g-4">
            <div className="col-md-5">
              <div className="card h-100">
                <div className="card-header">
                  <i className="bi bi-car-front-fill me-1 text-info"></i>
                  Shto veturë
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Targa</label>
                    <input
                      className="form-control"
                      value={vehicleForm.plate_number}
                      onChange={(e) =>
                        setVehicleForm((f) => ({
                          ...f,
                          plate_number: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Modeli</label>
                    <input
                      className="form-control"
                      value={vehicleForm.model}
                      onChange={(e) =>
                        setVehicleForm((f) => ({ ...f, model: e.target.value }))
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Ngjyra</label>
                    <input
                      className="form-control"
                      value={vehicleForm.color}
                      onChange={(e) =>
                        setVehicleForm((f) => ({ ...f, color: e.target.value }))
                      }
                    />
                  </div>
                  <button className="btn btn-primary w-100" onClick={addVehicle}>
                    Shto veturën
                  </button>
                </div>
              </div>
            </div>

            <div className="col-md-7">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between">
                  <span>Veturat e mia</span>
                  <button
                    className="btn btn-outline-light btn-sm"
                    onClick={loadVehicles}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                  </button>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-dark-custom table-striped align-middle">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Targa</th>
                          <th>Modeli</th>
                          <th>Ngjyra</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehicles.map((v) => (
                          <tr key={v.id}>
                            <td>{v.id}</td>
                            <td>{v.plate_number}</td>
                            <td>{v.model || ''}</td>
                            <td>{v.color || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="small text-secondary mb-0">
                    Përdor ID e veturës për të krijuar rezervim në seksionin Zones.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RESERVATIONS */}
        {activeSection === 'reservations' && (
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>
                <i className="bi bi-calendar-check me-1 text-warning"></i> Rezervimet e mia
              </span>
              <button
                className="btn btn-outline-light btn-sm"
                onClick={loadMyReservations}
              >
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-dark-custom table-striped align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Zona</th>
                      <th>Veturë</th>
                      <th>Status</th>
                      <th>Start</th>
                      <th>End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((r) => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.ParkingZone ? r.ParkingZone.name : r.ParkingZoneId}</td>
                        <td>{r.Vehicle ? r.Vehicle.plate_number : r.VehicleId}</td>
                        <td>
                          <span
                            className={
                              'badge bg-' +
                              (r.status === 'ACTIVE' ? 'success' : 'secondary')
                            }
                          >
                            {r.status}
                          </span>
                        </td>
                        <td>{new Date(r.start_time).toLocaleString()}</td>
                        <td>{new Date(r.end_time).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="small text-secondary mb-0">
                Rezervimet tuaja aktive dhe të kaluarat shfaqen më poshtë.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default App
