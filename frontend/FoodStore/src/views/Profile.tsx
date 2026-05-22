import { useState } from 'react'
import { useAuthStore, roleLabels } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge } from '../components/ui'
import {
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  Save,
  Bell,
  Palette,
  Monitor,
  LogOut,
  Key,
} from 'lucide-react'

export default function Profile() {
  const { user, updateUser, logout } = useAuthStore()
  const { setCurrentView } = useUIStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saved, setSaved] = useState(false)

  if (!user) return null

  const handleSave = () => {
    updateUser({ name, phone })
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleChangePassword = () => {
    if (newPassword && newPassword === confirmPassword) {
      // Simulación
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
        <p className="text-gray-500 text-sm">Gestioná tu cuenta y preferencias</p>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
          Cambios guardados correctamente
        </div>
      )}

      {/* Info personal */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <User size={20} className="text-orange-500" />
              Información Personal
            </span>
          </CardTitle>
          <Button
            variant={editing ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => editing ? handleSave() : setEditing(true)}
            leftIcon={editing ? <Save size={14} /> : undefined}
          >
            {editing ? 'Guardar' : 'Editar'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Avatar name={user.name} size="lg" className="w-16 h-16 text-lg" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
              <Badge variant="info">{roleLabels[user.role] || user.role}</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!editing}
              leftIcon={<User size={16} />}
              containerClassName="space-y-1"
            />
            <Input
              value={user.email}
              disabled
              leftIcon={<Mail size={16} />}
              containerClassName="space-y-1"
            />
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!editing}
              leftIcon={<Phone size={16} />}
              placeholder="Teléfono"
              containerClassName="space-y-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cambiar contraseña */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Lock size={20} className="text-orange-500" />
              Cambiar Contraseña
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Contraseña actual"
              leftIcon={<Key size={16} />}
              containerClassName="space-y-1"
            />
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nueva contraseña"
              leftIcon={<Lock size={16} />}
              containerClassName="space-y-1"
            />
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar contraseña"
              leftIcon={<Lock size={16} />}
              containerClassName="space-y-1"
            />
            <Button
              variant="primary"
              onClick={handleChangePassword}
              disabled={!newPassword || newPassword !== confirmPassword}
            >
              Actualizar Contraseña
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferencias rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Monitor size={20} className="text-orange-500" />
              Accesos Rápidos
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" fullWidth className="justify-start" leftIcon={<Bell size={18} />}>
              Notificaciones
            </Button>
            <Button variant="secondary" fullWidth className="justify-start" leftIcon={<Palette size={18} />}>
              Apariencia
            </Button>
            <Button variant="secondary" fullWidth className="justify-start" leftIcon={<Shield size={18} />}>
              Seguridad
            </Button>
            <Button
              variant="danger"
              fullWidth
              className="justify-start"
              leftIcon={<LogOut size={18} />}
              onClick={() => {
                logout()
                setCurrentView('login')
              }}
            >
              Cerrar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Avatar({ name, size = 'md', className = '' }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeMap = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-12 h-12 text-lg' }
  const colors = ['bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500']
  const bgColor = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`${bgColor} ${sizeMap[size]} rounded-full flex items-center justify-center text-white font-bold ${className}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
