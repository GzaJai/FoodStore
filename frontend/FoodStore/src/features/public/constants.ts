import type { LucideIcon } from 'lucide-react'
import { ShoppingBag, Bike, UtensilsCrossed } from 'lucide-react'
import type { PublicOrderPayload } from '../../api/public'

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price)
}

export const PRODUCT_IMAGES: Record<string, string> = {
  'Hamburguesa Clásica': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDC1GV1Ni_z-jWox_J4evR7qJtbbV4cUA6hrNQapC1IFVohX3ItU8t0zyF9V_pz6jgS30zxsh5_nCpQ3-IrdLrLVSX6SaJlL9uRdsbzHglseRJT2jxDWqDDLk1xjdvQFlB1pmhS0Kvdd7oA4dwKmTpcH5QhPcWRaAWs_yE7tj0WUDIhi41XP9KaOopNdugy3Uttgel8JOxmMud-JtirhY_8C5k77ZIzLkvVRbGPWsm_SjAgaObnIGCAIb1t8gppNs_IOJvoffN3f6s',
  'Pizza Mozzarella': 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4rE75D6r0oLMDcrsorhrYKE5rv4Va-u4JzIK1ZqiKiqOVEtm75MWAdzvuvkBCxq8-iYSB0_WpkMODoq8wQldqMmtbAFLMwqoQBcQQNQBEr4qIm4d-ZZz7_NTstkpRM7SADM3KD7Nw_sbPN1MYMycgCsuDaCvRMDOUgp-6mO3ZcL3o6bBskl3YrMjHZ7MkCh5XiDWywVzUMWpgh7tnb8fKHaUZz07Qgk3iltL1TfxvFFWi6TXJt_oq8oVR9V_zScTInf0jhy3ewSg',
  'Ensalada César': 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5b2i7C-NAF8TE2n6FAzKY8eGiqBz3gALy6hEKDqHPtUOCXok8NNNAkfGv93JYotFA5sQwh33cGacDGhqNlG3eIavIQ71anGP3TGz9EFQE5gX37NXO_S9F-53CHLTLJWk9IK8JzgHfByMCG2KQjkH5u9IfcSOZZGdrXiNBmw2QcUcVlSyh9zjkn28d7l7H0W5AjZ7MX6eIkOTNWyNZiDYrsMfMtR0X1m4-yDWRK_TEykadZwK6dmfwcBgmNK1QzN6kQHtuyMN3aA8',
  'Empanadas x6': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUbF4yiDv7ivAzp4RXDsL8uEbgamAHZ-fp8Giy-22ybEAxSdWk_4W-eWhXL6YvA1e-my4ujQ099SKLRPpfWW9q052VHUrZI-sj2QMGRSaQVn6DzsOU_g6opnh620qo477_jzycKYxGP5v4KoejH4sadR_gQsxGMKyG8AeKsl62gdOPnWEbV0u48gZCyyxyhp_JwitvVBqdQDcSscaB942fehjp_eh467ZUmrp16UhiYgeYqSrfCms8t4uCuN442rPCZvzxVS-QnLI',
  'Café Latte Grande': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYcdTplCVIAhWvVA2Ps7aEakxI-sDKYzyNgdP9c7z8wCdv3X_RwOg9_q6UJEOkA-9ekgX97S5tv_64lJZ8zDg1GRvQcJCp7knlPX-A_idvPjt9y0dHRP7DoG107xW6LMvaaVO32-RnzEv24cMeY8bcOc7IBUmPN3XbeyemVWw2syjH9TwYIN4zwohhXZI9Zc__qlY2LfJK7HlXp__7z36wu8G1vdZK9rkyrccPRl8WLk8OqVCynqCzL-SMmNuF7aYcxwtzyBKiD3k',
  'Tostado Jamón y Queso': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCiCvLj7PU3MgU2wn0NyWNL1GW2j-6o_YXs8kT9VrbLtTIWacdTN-iAP4f8MnrWrf8hsvsLg6UGG02OaP-QYclU5bMgYNeFaCznMYnRrYZI0KRSh7tT-FXa7F5ohNFS6gATpF8B8_my-mRXLfiJ-KpSMgAkUygU7N2vP6r64Kk8VSlZGVYCGj6Tmi17jdytRqCWRvZxuymffHc1z0Y3ftxnvvBMb39yIskLuVaW9fbwLzJwWZ1yQFEx_4coonzlRZz1x5E3lee06Sw',
}

export const CATEGORY_BG: Record<string, string> = {
  ALMUERZOS: '#FFF5EE',
  SANDWICHES: '#F5F5F5',
  PIZZAS: '#F5F5F5',
  DESAYUNOS: '#E1F5FE',
  BEBIDAS: '#E1F5FE',
  POSTRES: '#FFF8E1',
  ENTRADAS: '#E8F5E9',
  OTROS: '#F5F5F5',
}

export const CATEGORY_EMOJI: Record<string, string> = {
  ALMUERZOS: '🍽️',
  SANDWICHES: '🥪',
  PIZZAS: '🍕',
  DESAYUNOS: '☕',
  BEBIDAS: '🥤',
  POSTRES: '🍰',
  ENTRADAS: '🥗',
  OTROS: '📦',
}

export type Page = 'catalog' | 'cart' | 'checkout-info' | 'checkout-payment' | 'confirmed' | 'product-detail' | 'profile'

export interface ChannelOption {
  value: PublicOrderPayload['channel']
  label: string
  icon: LucideIcon
}

export const CHANNELS: ChannelOption[] = [
  { value: 'TAKEAWAY', label: 'Take Away', icon: ShoppingBag },
  { value: 'DELIVERY', label: 'Delivery', icon: Bike },
  { value: 'TABLE', label: 'Mesa', icon: UtensilsCrossed },
]
