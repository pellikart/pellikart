import { useLocation } from 'react-router-dom'

/**
 * Base path for the vendor management screens. Normally '/vendor', but when an
 * admin is editing a vendor those same screens are hosted under
 * '/admin/vendor/:id', so their internal navigation must resolve there instead.
 * Lets us reuse VendorProfile / VendorListings / VendorEditListing /
 * VendorAddListing verbatim in both contexts.
 */
export function useVendorBase(): string {
  const { pathname } = useLocation()
  const m = pathname.match(/^(\/admin\/vendor\/[^/]+)/)
  return m ? m[1] : '/vendor'
}
