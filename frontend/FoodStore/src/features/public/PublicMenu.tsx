import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useCartStore } from '../../stores/cartStore'
import { listPublicProductsApi, createPublicOrderApi, type PublicOrderPayload } from '../../api/public'
import type { ApiProductResponse } from '../../types/api'
import type { Page } from './constants'
import { CatalogView } from './components/CatalogView'
import { ProductDetailView } from './components/ProductDetailView'
import { ProfileView } from './components/ProfileView'
import { CartView } from './components/CartView'
import { CheckoutInfoView } from './components/CheckoutInfoView'
import { CheckoutPaymentView } from './components/CheckoutPaymentView'
import { ConfirmedView } from './components/ConfirmedView'

export default function PublicMenu() {
  const [products, setProducts] = useState<ApiProductResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [page, setPage] = useState<Page>('catalog')
  const { items, addItem, updateQuantity, totalItems, clearCart } = useCartStore()

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [channel, setChannel] = useState<PublicOrderPayload['channel']>('TAKEAWAY')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [selectedProduct, setSelectedProduct] = useState<ApiProductResponse | null>(null)
  const [detailQuantity, setDetailQuantity] = useState(1)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    listPublicProductsApi()
      .then(setProducts)
      .catch(() => setError('No pudimos cargar el menú. Intentalo de nuevo más tarde.'))
      .finally(() => setIsLoading(false))
  }, [])

  const categories = ['ALL', ...new Set(products.map((p) => p.category))]

  const navigate = (target: Page) => {
    setPage(target)
    setFormError(null)
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
    setCustomerName('')
    setCustomerPhone('')
    setCustomerEmail('')
    setChannel('TAKEAWAY')
    setAddress('')
    setNotes('')
    setFormError(null)
    setPage('checkout-info')
  }

  const handleNextToPayment = () => {
    if (!customerName.trim()) { setFormError('Ingresá tu nombre'); return }
    if (!customerPhone.trim()) { setFormError('Ingresá tu teléfono'); return }
    if (channel === 'DELIVERY' && !address.trim()) { setFormError('Ingresá la dirección'); return }
    setFormError(null)
    setPage('checkout-payment')
  }

  const handleConfirmPayment = async () => {
    setIsProcessing(true)
    setFormError(null)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    try {
      const payload: PublicOrderPayload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        channel,
        address: channel === 'DELIVERY' ? address.trim() : undefined,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      }
      const order = await createPublicOrderApi(payload)
      setOrderNumber(order.order_number)
      setPage('confirmed')
      clearCart()
    } catch {
      setFormError('Hubo un error al procesar el pedido. Intentalo de nuevo.')
    } finally {
      setIsProcessing(false)
    }
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
          totalCartItems={totalItems()}
          activePage={page}
          onCategorySelect={setActiveCategory}
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
          customerName={customerName}
          customerPhone={customerPhone}
          customerEmail={customerEmail}
          totalCartItems={totalItems()}
          activePage={page}
          onNameChange={setCustomerName}
          onPhoneChange={setCustomerPhone}
          onEmailChange={setCustomerEmail}
          onSave={goBackToCatalog}
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
          onNameChange={setCustomerName}
          onPhoneChange={setCustomerPhone}
          onEmailChange={setCustomerEmail}
          onChannelChange={setChannel}
          onAddressChange={setAddress}
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
          formError={formError}
          isProcessing={isProcessing}
          onBack={() => setPage('checkout-info')}
          onConfirm={handleConfirmPayment}
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
