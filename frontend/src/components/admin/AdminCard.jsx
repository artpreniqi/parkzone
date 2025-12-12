export default function AdminCard({ title, value, icon, color = 'success' }) {
  return (
    <div className="col-md-2">
      <div className="card text-center h-100">
        <div className="card-body">
          <i className={`bi bi-${icon} fs-3 text-${color}`}></i>
          <h6 className="mt-2">{title}</h6>
          <h3 className="fw-bold mb-0">{value ?? '-'}</h3>
        </div>
      </div>
    </div>
  )
}
