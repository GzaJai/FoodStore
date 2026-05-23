import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCartStore } from '../../stores/cartStore'
import { listPublicProductsApi, createPublicOrderApi, type PublicOrderPayload } from '../../api/public'
import type { ApiProductResponse } from '../../types/api'
import { Plus, Minus, Trash2, ShoppingCart, ChevronLeft, Check, Search, User, Phone, Mail, MapPin, Bike, ShoppingBag, UtensilsCrossed, Store, Loader2, AlertTriangle, ChevronRight, Package, SlidersHorizontal, Star, Heart, Home, MoreVertical } from 'lucide-react'

type Page = 'catalog' | 'cart' | 'checkout-info' | 'checkout-payment' | 'confirmed' | 'product-detail' | 'profile'

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price)
}

const PRODUCT_IMAGES: Record<string, string> = {
  'Hamburguesa Clásica': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDC1GV1Ni_z-jWox_J4evR7qJtbbV4cUA6hrNQapC1IFVohX3ItU8t0zyF9V_pz6jgS30zxsh5_nCpQ3-IrdLrLVSX6SaJlL9uRdsbzHglseRJT2jxDWqDDLk1xjdvQFlB1pmhS0Kvdd7oA4dwKmTpcH5QhPcWRaAWs_yE7tj0WUDIhi41XP9KaOopNdugy3Uttgel8JOxmMud-JtirhY_8C5k77ZIzLkvVRbGPWsm_SjAgaObnIGCAIb1t8gppNs_IOJvoffN3f6s',
  'Pizza Mozzarella': 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4rE75D6r0oLMDcrsorhrYKE5rv4Va-u4JzIK1ZqiKiqOVEtm75MWAdzvuvkBCxq8-iYSB0_WpkMODoq8wQldqMmtbAFLMwqoQBcQQNQBEr4qIm4d-ZZz7_NTstkpRM7SADM3KD7Nw_sbPN1MYMycgCsuDaCvRMDOUgp-6mO3ZcL3o6bBskl3YrMjHZ7MkCh5XiDWywVzUMWpgh7tnb8fKHaUZz07Qgk3iltL1TfxvFFWi6TXJt_oq8oVR9V_zScTInf0jhy3ewSg',
  'Ensalada César': 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5b2i7C-NAF8TE2n6FAzKY8eGiqBz3gALy6hEKDqHPtUOCXok8NNNAkfGv93JYotFA5sQwh33cGacDGhqNlG3eIavIQ71anGP3TGz9EFQE5gX37NXO_S9F-53CHLTLJWk9IK8JzgHfByMCG2KQjkH5u9IfcSOZZGdrXiNBmw2QcUcVlSyh9zjkn28d7l7H0W5AjZ7MX6eIkOTNWyNZiDYrsMfMtR0X1m4-yDWRK_TEykadZwK6dmfwcBgmNK1QzN6kQHtuyMN3aA8',
  'Empanadas x6': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUbF4yiDv7ivAzp4RXDsL8uEbgamAHZ-fp8Giy-22ybEAxSdWk_4W-eWhXL6YvA1e-my4ujQ099SKLRPpfWW9q052VHUrZI-sj2QMGRSaQVn6DzsOU_g6opnh620qo477_jzycKYxGP5v4KoejH4sadR_gQsxGMKyG8AeKsl62gdOPnWEbV0u48gZCyyxyhp_JwitvVBqdQDcSscaB942fehjp_eh467ZUmrp16UhiYgeYqSrfCms8t4uCuN442rPCZvzxVS-QnLI',
  'Café Latte Grande': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYcdTplCVIAhWvVA2Ps7aEakxI-sDKYzyNgdP9c7z8wCdv3X_RwOg9_q6UJEOkA-9ekgX97S5tv_64lJZ8zDg1GRvQcJCp7knlPX-A_idvPjt9y0dHRP7DoG107xW6LMvaaVO32-RnzEv24cMeY8bcOc7IBUmPN3XbeyemVWw2syjH9TwYIN4zwohhXZI9Zc__qlY2LfJK7HlXp__7z36wu8G1vdZK9rkyrccPRl8WLk8OqVCynqCzL-SMmNuF7aYcxwtzyBKiD3k',
  'Tostado Jamón y Queso': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCiCvLj7PU3MgU2wn0NyWNL1GW2j-6o_YXs8kT9VrbLtTIWacdTN-iAP4f8MnrWrf8hsvsLg6UGG02OaP-QYclU5bMgYNeFaCznMYnRrYZI0KRSh7tT-FXa7F5ohNFS6gATpF8B8_my-mRXLfiJ-KpSMgAkUygU7N2vP6r64Kk8VSlZGVYCGj6Tmi17jdytRqCWRvZxuymffHc1z0Y3ftxnvvBMb39yIskLuVaW9fbwLzJwWZ1yQFEx_4coonzlRZz1x5E3lee06Sw',
}

const CATEGORY_BG: Record<string, string> = {
  ALMUERZOS: '#FFF5EE',
  SANDWICHES: '#F5F5F5',
  PIZZAS: '#F5F5F5',
  DESAYUNOS: '#E1F5FE',
  BEBIDAS: '#E1F5FE',
  POSTRES: '#FFF8E1',
  ENTRADAS: '#E8F5E9',
  OTROS: '#F5F5F5',
}

const CATEGORY_EMOJI: Record<string, string> = {
  ALMUERZOS: '🍽️',
  SANDWICHES: '🥪',
  PIZZAS: '🍕',
  DESAYUNOS: '☕',
  BEBIDAS: '🥤',
  POSTRES: '🍰',
  ENTRADAS: '🥗',
  OTROS: '📦',
}

export default function PublicMenu() {
  const [products, setProducts] = useState<ApiProductResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [page, setPage] = useState<Page>('catalog')
  const { items, addItem, updateQuantity, totalItems, totalPrice, clearCart } = useCartStore()

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
  const filteredProducts = activeCategory === 'ALL' ? products : products.filter((p) => p.category === activeCategory)

  const goToCart = () => {
    setPage('cart')
    setFormError(null)
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

  const goBackToCatalog = () => {
    setPage('catalog')
    setOrderNumber(null)
    setSelectedProduct(null)
  }

  const goToDetail = (product: ApiProductResponse) => {
    setSelectedProduct(product)
    setDetailQuantity(1)
    setPage('product-detail')
  }

  const renderBottomNav = () => (
    <nav className="fixed bottom-0 left-0 w-full bg-primary-container z-50 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] rounded-t-3xl">
      <div className="flex justify-around items-center px-8 relative">
        <button 
          className={`transition-colors ${page === 'profile' ? 'text-white' : 'text-white/60'}`} 
          onClick={() => setPage('profile')}
        >
          <User size={28} strokeWidth={2.5} />
        </button>
        <button onClick={() => setPage('catalog')} className="relative transition-colors">
          <div className="bg-white text-primary-container w-14 h-14 rounded-full flex items-center justify-center -mt-8 shadow-xl active:scale-95 transition-transform">
            <Home size={32} strokeWidth={2.5} />
          </div>
        </button>
        <button 
          onClick={goToCart} 
          className={`relative transition-colors ${page === 'cart' || page === 'checkout-info' ? 'text-white' : 'text-white/60'}`}
        >
          <ShoppingCart size={28} strokeWidth={2.5} />
          {totalItems() > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-white text-primary text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-primary">
              {totalItems()}
            </span>
          )}
        </button>
      </div>
    </nav>
  )

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

  if (page === 'catalog') {
    return (
      <div className="min-h-screen bg-white text-gray-900 pb-32 font-sans">
        {/* Header */}
        <header className="px-6 pt-12 pb-4">
          <h1 className="text-5xl font-normal text-black font-['Lobster'] tracking-wide">Foodgo</h1>
          <p className="text-gray-500 text-[15px] mt-2 mb-6 font-medium">¡Pedí tu comida favorita!</p>
          
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-white border border-gray-200 rounded-2xl flex items-center px-4 py-3.5 shadow-sm">
              <Search size={22} className="text-gray-700 mr-2" strokeWidth={2.5} />
              <input type="text" placeholder="Search" className="bg-transparent border-none outline-none w-full text-gray-700 placeholder-gray-500 font-medium" />
            </div>
            <div className="bg-primary-container rounded-2xl p-3.5 text-white shadow-md active:scale-95 transition-transform cursor-pointer">
              <SlidersHorizontal size={22} strokeWidth={2.5} />
            </div>
          </div>
        </header>

        {/* Categories */}
        <section className="mt-4 px-6">
          <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar items-center">
            {categories.map((cat) => {
              const isAll = cat === 'ALL'
              const isActive = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-none text-[15px] transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-primary-container text-white rounded-2xl px-6 py-2.5 font-bold shadow-md'
                      : 'border border-gray-200 text-gray-700 bg-white rounded-2xl px-5 py-2.5 font-medium'
                  }`}
                >
                  {isAll ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                </button>
              )
            })}
          </div>
        </section>

        {/* Products Grid */}
        <main className="mt-6 px-6">

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={32} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map((product) => {
                const imgUrl = PRODUCT_IMAGES[product.name]
                return (
                  <div key={product.id} className="bg-white rounded-[28px] border border-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden relative cursor-pointer" onClick={() => goToDetail(product)}>
                    <div className="relative w-full aspect-square p-4 pb-0 flex items-center justify-center bg-white">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={product.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="text-6xl flex items-center justify-center w-full h-full bg-gray-50 rounded-2xl">
                          {CATEGORY_EMOJI[product.category] ?? '🍴'}
                        </div>
                      )}
                    </div>

                    <div className="p-4 pt-3 flex flex-col flex-1">
                      <h3 className="text-[15px] font-bold text-gray-900 leading-tight truncate">{product.name}</h3>
                      <p className="text-[13px] text-gray-500 mt-0.5 font-medium line-clamp-1">{product.category}</p>
                      <div className="flex items-center justify-between mt-auto pt-3">
                        <div className="flex items-center gap-1.5 text-[14px] font-bold text-gray-800">
                           <Star size={14} className="fill-[#ffc107] text-[#ffc107]" />
                           <span>4.8</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); /* just toggle favorite */ }} className="text-gray-800 active:scale-90 transition-transform">
                          <Heart size={22} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
        {renderBottomNav()}
      </div>
    )
  }

  if (page === 'product-detail' && selectedProduct) {
     const product = selectedProduct
     const imgUrl = PRODUCT_IMAGES[product.name]
     return (
       <div className="min-h-screen bg-white text-gray-900 pb-32 font-sans flex flex-col">
         {/* Top red section */}
         <div className="bg-primary-container rounded-b-[40px] pt-8 px-6 pb-24 relative shadow-xl">
           <div className="flex items-center justify-between text-white mb-6 relative z-10">
             <button onClick={goBackToCatalog} className="bg-white text-primary w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-sm">
               <ChevronLeft size={24} strokeWidth={2.5} />
             </button>
           </div>
         </div>
         {/* Image overlapping */}
         <div className="relative -mt-32 px-8 flex justify-center z-10 h-64">
           {imgUrl ? (
              <img src={imgUrl} alt={product.name} className="w-full h-full object-contain drop-shadow-2xl" />
           ) : (
              <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center text-6xl shadow-2xl">
                {CATEGORY_EMOJI[product.category] ?? '🍴'}
              </div>
           )}
         </div>
         {/* Content */}
         <div className="px-6 mt-6 flex-1">
           <div className="flex items-center justify-between mb-2">
             <h2 className="text-2xl font-bold text-gray-900 leading-tight pr-4">{product.name}</h2>
             <span className="text-xl font-bold text-primary whitespace-nowrap">{formatPrice(product.price)}</span>
           </div>
           <p className="text-gray-500 font-medium text-sm mb-6">{product.category}</p>

           <div className="flex gap-4 mb-6">
             <button className="bg-primary-container text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md">Detalles</button>
             <button className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-full font-bold text-sm">Reseñas</button>
           </div>

           <p className="text-gray-600 text-[15px] leading-relaxed mb-6">
             {product.description || 'Delicioso plato preparado con los mejores ingredientes frescos. Perfecto para disfrutar en cualquier momento.'}
           </p>
         </div>

         {/* Bottom Action */}
         <div className="px-6 flex items-center justify-between mb-8 mt-auto gap-4">
           <div className="flex items-center justify-between bg-white border border-gray-100 shadow-sm rounded-full px-2 py-2 w-32">
             <button onClick={() => setDetailQuantity(Math.max(1, detailQuantity - 1))} className="bg-primary-container text-white w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform">
               <Minus size={16} strokeWidth={3} />
             </button>
             <span className="font-bold text-lg text-center w-8">{detailQuantity}</span>
             <button onClick={() => setDetailQuantity(detailQuantity + 1)} className="bg-primary-container text-white w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform">
               <Plus size={16} strokeWidth={3} />
             </button>
           </div>
           <button 
             onClick={() => {
               for(let i=0; i<detailQuantity; i++) addItem(product);
               goBackToCatalog();
             }} 
             className="bg-primary-container text-white font-bold py-4 px-8 rounded-full flex-1 shadow-lg active:scale-95 transition-transform"
           >
             Agregar al carrito
           </button>
         </div>
       </div>
     )
  }

  if (page === 'profile') {
     return (
       <div className="min-h-screen bg-white text-gray-900 pb-32 font-sans flex flex-col">
         <header className="px-5 pt-8 pb-4">
           <div className="flex items-center gap-4">
             <button onClick={goBackToCatalog} className="bg-white text-gray-900 w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
               <ChevronLeft size={24} />
             </button>
             <h1 className="text-2xl font-extrabold tracking-tight text-black">Mi Perfil</h1>
           </div>
         </header>
         <div className="px-6 mt-4 flex-1">
           <div className="flex flex-col items-center mb-8">
             <div className="w-24 h-24 bg-primary-container text-white rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg border-4 border-primary/20">
               <User size={48} />
             </div>
             <p className="text-xl font-bold">{customerName || 'Usuario Foodgo'}</p>
           </div>
           
           <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Nombre</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:border-primary-container outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Teléfono</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+54 9 11 1234-5678"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:border-primary-container outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:border-primary-container outline-none"
                  />
                </div>
              </div>
              <button className="w-full bg-primary-container text-white font-bold py-4 rounded-2xl mt-4 active:scale-95 transition-transform shadow-md" onClick={goBackToCatalog}>
                Guardar Cambios
              </button>
              
              <div className="mt-8 text-center pb-8">
                <Link to="/negocio/login" className="text-primary font-bold text-sm underline">Ingreso para negocios</Link>
              </div>
           </div>
         </div>
         {renderBottomNav()}
       </div>
     )
  }

  if (page === 'cart') {
    const subtotal = totalPrice()
    const tax = subtotal * 0.21
    const total = subtotal + tax

    return (
      <div className="min-h-screen bg-white text-on-surface flex flex-col pb-24">
        <header className="bg-surface-container-lowest px-4 py-4 flex items-center gap-3 border-b border-outline-variant">
          <button onClick={goBackToCatalog} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-headline-lg-mobile font-headline">Tu pedido</h1>
        </header>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart size={48} className="mx-auto text-outline mb-4" />
              <p className="text-body-lg text-on-surface-variant">El carrito está vacío</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="bg-surface-container-lowest rounded-xl p-4 delicious-shadow flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: CATEGORY_BG[item.product.category] ?? '#F5F5F5' }}
                >
                  {CATEGORY_EMOJI[item.product.category] ?? '🍴'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-title-md font-title text-on-surface truncate">{item.product.name}</p>
                  <p className="text-body-sm text-on-surface-variant">{formatPrice(item.product.price)} c/u</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
                  >
                    {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                  </button>
                  <span className="text-sm font-bold min-w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="bg-surface-container-lowest border-t border-outline-variant p-4 space-y-3">
            <div className="flex justify-between text-body-sm text-on-surface-variant">
              <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-body-sm text-on-surface-variant">
              <span>IVA (21%)</span><span>{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between text-title-md font-bold text-on-surface border-t border-outline-variant pt-2">
              <span>Total</span><span>{formatPrice(total)}</span>
            </div>
            <button
              onClick={goToCheckoutInfo}
              className="w-full bg-primary-container text-on-primary font-bold py-4 rounded-xl active:scale-[0.98] transition-transform text-body-lg"
            >
              Continuar
            </button>
          </div>
        )}
        {renderBottomNav()}
      </div>
    )
  }

  if (page === 'checkout-info') {
    const CHANNELS: { value: PublicOrderPayload['channel']; label: string; icon: React.ReactNode }[] = [
      { value: 'TAKEAWAY', label: 'Take Away', icon: <ShoppingBag size={20} /> },
      { value: 'DELIVERY', label: 'Delivery', icon: <Bike size={20} /> },
      { value: 'TABLE', label: 'Mesa', icon: <UtensilsCrossed size={20} /> },
    ]

    return (
      <div className="min-h-screen bg-white text-on-surface flex flex-col pb-24">
        <header className="bg-surface-container-lowest px-4 py-4 flex items-center gap-3 border-b border-outline-variant">
          <button onClick={() => setPage('cart')} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-headline-lg-mobile font-headline">Tus datos</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <div className="w-6 h-0.5 bg-outline-variant" />
            <div className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {formError && (
            <div className="bg-error-container text-on-error-container text-body-sm rounded-xl p-3">
              {formError}
            </div>
          )}

          <div>
            <label className="text-label-md font-label text-on-surface-variant mb-2 block">¿Cómo querés recibirlo?</label>
            <div className="grid grid-cols-3 gap-2">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.value}
                  onClick={() => setChannel(ch.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all active:scale-95 ${
                    channel === ch.value
                      ? 'border-primary-container bg-white/10 text-primary'
                      : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-outline'
                  }`}
                >
                  {ch.icon}
                  <span className="text-label-md font-label">{ch.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-label-md font-label text-on-surface-variant mb-1 block">Nombre *</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full pl-10 pr-3 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm focus:ring-2 focus:ring-primary focus:border-primary-container outline-none placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>

          <div>
            <label className="text-label-md font-label text-on-surface-variant mb-1 block">Teléfono *</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+54 9 11 1234-5678"
                className="w-full pl-10 pr-3 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm focus:ring-2 focus:ring-primary focus:border-primary-container outline-none placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>

          <div>
            <label className="text-label-md font-label text-on-surface-variant mb-1 block">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full pl-10 pr-3 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm focus:ring-2 focus:ring-primary focus:border-primary-container outline-none placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>

          {channel === 'DELIVERY' && (
            <div>
              <label className="text-label-md font-label text-on-surface-variant mb-1 block">Dirección *</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle y número"
                  className="w-full pl-10 pr-3 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm focus:ring-2 focus:ring-primary focus:border-primary-container outline-none placeholder:text-on-surface-variant/50"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-label-md font-label text-on-surface-variant mb-1 block">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alguna aclaración?"
              rows={3}
              className="w-full px-3 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm focus:ring-2 focus:ring-primary focus:border-primary-container outline-none resize-none placeholder:text-on-surface-variant/50"
            />
          </div>
        </div>

        <div className="bg-surface-container-lowest border-t border-outline-variant p-4">
          <button
            onClick={handleNextToPayment}
            className="w-full bg-primary-container text-on-primary font-bold py-4 rounded-xl active:scale-[0.98] transition-transform text-body-lg"
          >
            Ir a pagar
          </button>
        </div>
        {renderBottomNav()}
      </div>
    )
  }

  if (page === 'checkout-payment') {
    const subtotal = totalPrice()
    const tax = subtotal * 0.21
    const total = subtotal + tax

    return (
      <div className="min-h-screen bg-white text-on-surface flex flex-col">
        <header className="bg-surface-container-lowest px-4 py-4 flex items-center gap-3 border-b border-outline-variant">
          <button onClick={() => setPage('checkout-info')} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-headline-lg-mobile font-headline">Confirmar pago</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <div className="w-6 h-0.5 bg-primary" />
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {formError && (
            <div className="bg-error-container text-on-error-container text-body-sm rounded-xl p-3">
              {formError}
            </div>
          )}

          <div className="bg-surface-container-lowest rounded-xl p-4 delicious-shadow space-y-2">
            <p className="text-title-md font-title text-on-surface mb-2">Resumen del pedido</p>
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-body-sm">
                <span className="text-on-surface-variant">{item.quantity}x {item.product.name}</span>
                <span className="font-medium">{formatPrice(item.product.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-outline-variant pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-body-sm text-on-surface-variant">
                <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-body-sm text-on-surface-variant">
                <span>IVA (21%)</span><span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-title-md font-bold text-on-surface pt-1">
                <span>Total</span><span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-4 delicious-shadow text-body-sm text-on-surface-variant space-y-1.5">
            <p className="flex items-center gap-2"><User size={16} /> {customerName}</p>
            <p className="flex items-center gap-2"><Phone size={16} /> {customerPhone}</p>
            {customerEmail && <p className="flex items-center gap-2"><Mail size={16} /> {customerEmail}</p>}
            <p className="flex items-center gap-2">
              {channel === 'DELIVERY' ? <Bike size={16} /> : channel === 'TABLE' ? <UtensilsCrossed size={16} /> : <ShoppingBag size={16} />}
              {channel === 'TAKEAWAY' ? 'Take Away' : channel === 'DELIVERY' ? 'Delivery' : 'Mesa'}
              {channel === 'DELIVERY' && address && ` \u2014 ${address}`}
            </p>
          </div>

          <div className="bg-surface-container rounded-xl p-3 text-body-sm text-on-surface-variant flex items-start gap-2">
            <Store size={16} className="mt-0.5 shrink-0" />
            <span>
              Pago simulado. {/* TODO: Integrar con Mercado Pago */}
              Cuando integremos Mercado Pago, aquí se abrirá el checkout para pagar con débito, crédito o efectivo.
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border-t border-outline-variant p-4 space-y-2">
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-body-sm text-on-surface-variant">
              <Loader2 size={16} className="animate-spin" />
              Procesando pago...
            </div>
          )}
          <button
            onClick={handleConfirmPayment}
            disabled={isProcessing}
            className="w-full bg-primary-container text-on-primary font-bold py-4 rounded-xl active:scale-[0.98] transition-transform text-body-lg disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <Check size={20} />
                Confirmar pago
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  if (page === 'confirmed') {
    return (
      <div className="min-h-screen bg-white text-on-surface flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-primary" />
          </div>
          <h2 className="text-headline-lg font-headline text-on-surface mb-2">¡Pedido confirmado!</h2>
          <p className="text-body-lg text-on-surface-variant mb-6">Tu pedido ya está en cocina</p>

          {orderNumber && (
            <div className="bg-white/10 border border-primary/20 rounded-xl p-5 mb-6 inline-block">
              <p className="text-label-md font-label text-primary mb-1">Número de pedido</p>
              <p className="text-display-lg font-display text-primary font-extrabold">{orderNumber}</p>
            </div>
          )}

          <p className="text-body-sm text-on-surface-variant mb-8">
            Te avisaremos cuando esté listo. Guardá el número de pedido para retirar.
          </p>

          <button
            onClick={goBackToCatalog}
            className=" text-on-primary font-bold py-4 px-8 rounded-xl active:scale-[0.98] transition-transform text-body-lg"
          >
            Seguir viendo el menú
          </button>
        </div>
      </div>
    )
  }

  return null
}
