import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, roleLabels } from '../../stores/authStore'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge } from '../shared/ui'
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
import { updateProfileApi, changePasswordApi } from '../../api/users'

export default function Profile() {
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saved, setSaved] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  if (!user) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateProfileApi({ name, phone: phone || undefined })
      updateUser({ name: updated.name, phone: updated.phone ?? '' })
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      updateUser({ name, phone })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess('')

    if (!newPassword) {
      setPasswordError('La nueva contraseña es obligatoria')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }
    if (!currentPassword) {
      setPasswordError('Ingresá tu contraseña actual')
      return
    }

    try {
      await changePasswordApi({ current_password: currentPassword, new_password: newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess('Contraseña actualizada correctamente')
      setTimeout(() => setPasswordSuccess(''), 3000)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Error al cambiar la contraseña')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
        <p className="text-gray-500 text-sm">Gestioná tu cuenta y preferencias</p>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
          Cambios guardados correctamente
        </div>
      )}

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
            disabled={saving}
          >
            {saving ? 'Guardando...' : editing ? 'Guardar' : 'Editar'}
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
          {passwordError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
              {passwordSuccess}
            </div>
          )}
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
                navigate('/negocio/login', { replace: true })
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
