import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useCartStore } from '../../stores/cartStore'
import { listPublicProductsApi, type PublicOrderPayload } from '../../api/public'
import type { ApiProductResponse } from '../../types/api'
import type { Page, SortOption } from './constants'
import { CatalogView } from './components/CatalogView'
import { ProductDetailView } from './components/ProductDetailView'
import { ProfileView } from './components/ProfileView'
import { CartView } from './components/CartView'
import { CheckoutInfoView } from './components/CheckoutInfoView'
import { CheckoutPaymentView } from './components/CheckoutPaymentView'
import { ConfirmedView } from './components/ConfirmedView'
import { LoginView } from './components/LoginView'
import { RegisterView } from './components/RegisterView'
import { AccountView } from './components/AccountView'

export default function PublicMenu() {
  const [products, setProducts] = useState<ApiProductResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [page, setPage] = useState<Page>('catalog')
  const { items, addItem, updateQuantity, totalItems, clearCart } = useCartStore()
  const { isAuthenticated, user, checkAuth, logout } = useAuthStore()

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [channel, setChannel] = useState<PublicOrderPayload['channel']>('TAKEAWAY')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [selectedProduct, setSelectedProduct] = useState<ApiProductResponse | null>(null)
  const [detailQuantity, setDetailQuantity] = useState(1)

  // ─── Cargar productos ──────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true)
    setError(null)
    listPublicProductsApi({ per_page: 100 })
      .then((res) => setProducts(res.items))
      .catch(() => setError('No pudimos cargar el menú. Intentalo de nuevo más tarde.'))
      .finally(() => setIsLoading(false))
  }, [])

  // ─── Verificar sesión al montar ────────────────────────────────────
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // ─── Detectar retorno de Mercado Pago ─────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get('payment')
    const orderNumberParam = params.get('order')

    if (paymentStatus === 'success' && orderNumberParam) {
      setOrderNumber(orderNumberParam)
      setPage('confirmed')
      clearCart()
      window.history.replaceState({}, '', '/')
    } else if (paymentStatus === 'failure') {
      setFormError('El pago no pudo ser procesado. Intentalo de nuevo.')
      window.history.replaceState({}, '', '/')
    }
  }, [clearCart])

  const categories = ['ALL', ...new Set(products.map((p) => p.category))]

  const navigate = (target: Page) => {
    setPage(target)
    setFormError(null)
    setFieldErrors({})
  }

  const goToDetail = (product: ApiProductResponse) => {
    setSelectedProduct(product)
    setDetailQuantity(1)
    setPage('product-detail')
  }

  const goBackToCatalog = () => {
    setPage('catalog')
    setOrderNumber(null)
    setSelectedProduct(null)
  }

  const goToCheckoutInfo = () => {
    if (items.length === 0) return
    // Si está logueado, pre-cargamos sus datos automáticamente
    setCustomerName(isAuthenticated ? user?.name ?? '' : '')
    setCustomerPhone(isAuthenticated ? user?.phone ?? '' : '')
    setCustomerEmail(isAuthenticated ? user?.email ?? '' : '')
    setChannel('TAKEAWAY')
    setAddress('')
    setNotes('')
    setFormError(null)
    setFieldErrors({})
    setPage('checkout-info')
  }

  const handleNextToPayment = () => {
    const errors: Record<string, string> = {}
    if (!isAuthenticated) {
      if (!customerName.trim()) errors.name = 'Ingresá tu nombre'
      if (!customerPhone.trim()) errors.phone = 'Ingresá tu teléfono'
    }
    if (channel === 'DELIVERY' && !address.trim()) errors.address = 'Ingresá la dirección'
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setFormError(null)
    setPage('checkout-payment')
  }

  // Limpiar error del campo cuando el usuario empieza a tipear
  const handleNameChange = (value: string) => {
    setCustomerName(value)
    setFieldErrors((prev) => { const { name: _, ...rest } = prev; return rest })
  }
  const handlePhoneChange = (value: string) => {
    setCustomerPhone(value)
    setFieldErrors((prev) => { const { phone: _, ...rest } = prev; return rest })
  }
  const handleAddressChange = (value: string) => {
    setAddress(value)
    setFieldErrors((prev) => { const { address: _, ...rest } = prev; return rest })
  }

  const handlePaymentComplete = (orderNumber: string) => {
    setOrderNumber(orderNumber)
    clearCart()
    setPage('confirmed')
  }

  const handleLogout = async () => {
    await logout()
    setPage('profile')
  }

  const handleAddToCart = () => {
    if (!selectedProduct) return
    for (let i = 0; i < detailQuantity; i++) addItem(selectedProduct)
    goBackToCatalog()
  }

  // ─── Error state ─────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-primary-container flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <AlertTriangle size={48} className="mx-auto text-primary mb-4" />
          <h2 className="text-headline-lg-mobile font-headline text-on-surface mb-2">Oops</h2>
          <p className="text-body-lg text-on-surface-variant">{error}</p>
          <Link
            to="/negocio/login"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary-container text-on-primary font-bold px-6 py-3 text-body-lg active:scale-[0.98] transition-transform"
          >
            Ingresar al negocio
          </Link>
        </div>
      </div>
    )
  }

  // ─── Page Router ──────────────────────────────────────────────────
  switch (page) {
    case 'catalog':
      return (
        <CatalogView
          products={products}
          isLoading={isLoading}
          categories={categories}
          activeCategory={activeCategory}
          searchQuery={searchQuery}
          sortBy={sortBy}
          totalCartItems={totalItems()}
          activePage={page}
          onSearchChange={setSearchQuery}
          onCategorySelect={setActiveCategory}
          onSortChange={setSortBy}
          onProductSelect={goToDetail}
          onNavigate={navigate}
        />
      )

    case 'product-detail':
      return selectedProduct ? (
        <ProductDetailView
          product={selectedProduct}
          quantity={detailQuantity}
          onQuantityChange={setDetailQuantity}
          onAddToCart={handleAddToCart}
          onBack={goBackToCatalog}
        />
      ) : null

    case 'profile':
      return (
        <ProfileView
          totalCartItems={totalItems()}
          activePage={page}
          onBack={goBackToCatalog}
          onNavigate={navigate}
        />
      )

    case 'cart':
      return (
        <CartView
          items={items}
          totalCartItems={totalItems()}
          activePage={page}
          onUpdateQuantity={updateQuantity}
          onBack={goBackToCatalog}
          onCheckout={goToCheckoutInfo}
          onNavigate={navigate}
        />
      )

    case 'checkout-info':
      return (
        <CheckoutInfoView
          customerName={customerName}
          customerPhone={customerPhone}
          customerEmail={customerEmail}
          channel={channel}
          address={address}
          notes={notes}
          formError={formError}
          totalCartItems={totalItems()}
          activePage={page}
          fieldErrors={fieldErrors}
          onNameChange={handleNameChange}
          onPhoneChange={handlePhoneChange}
          onEmailChange={setCustomerEmail}
          onChannelChange={setChannel}
          onAddressChange={handleAddressChange}
          onNotesChange={setNotes}
          onBack={() => setPage('cart')}
          onNext={handleNextToPayment}
          onNavigate={navigate}
        />
      )

    case 'checkout-payment':
      return (
        <CheckoutPaymentView
          items={items}
          customerName={customerName}
          customerPhone={customerPhone}
          customerEmail={customerEmail}
          channel={channel}
          address={address}
          notes={notes}
          formError={formError}
          onBack={() => setPage('checkout-info')}
          onPaymentComplete={handlePaymentComplete}
          onClearCart={clearCart}
        />
      )

    case 'login':
      return (
        <LoginView
          onBack={() => setPage('profile')}
          onLoggedIn={() => setPage('account')}
          onGoToRegister={() => setPage('register')}
        />
      )

    case 'register':
      return (
        <RegisterView
          onBack={() => setPage('profile')}
          onRegistered={() => setPage('account')}
          onGoToLogin={() => setPage('login')}
        />
      )

    case 'account':
      return (
        <AccountView
          onBack={() => setPage('profile')}
          onLogout={handleLogout}
        />
      )

    case 'confirmed':
      return (
        <ConfirmedView
          orderNumber={orderNumber}
          onBackToCatalog={goBackToCatalog}
        />
      )

    default:
      return null
  }
}
