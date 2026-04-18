import { supabase } from '../../lib/supabase-client';
import { Db } from '../tables';

/**
 * Visibilité catalogue côté client : afficher sauf si `is_available` est explicitement `false`.
 * (Les imports / anciennes lignes avec `NULL` étaient exclus par `.eq('is_available', true)`.)
 */
const productVisibleOr = 'is_available.eq.true,is_available.is.null';

/** Accès catalogue — utilisé par CatalogContext et vues ; pas de logique métier ici. */
export const catalogRepo = {
  categories: () => supabase.from(Db.categories).select('*').order('display_order', { ascending: true }),

  storesPage: (from: number, to: number) =>
    supabase
      .from(Db.stores)
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to),

  subCategories: () => supabase.from(Db.subCategories).select('*').order('name', { ascending: true }),

  newProducts: () =>
    supabase.from(Db.products).select('*').or(productVisibleOr).order('created_at', { ascending: false }).limit(20),

  storeById: (storeId: string) => supabase.from(Db.stores).select('*').eq('id', storeId).single(),

  productById: (productId: string) =>
    supabase.from(Db.products).select('*').eq('id', productId).or(productVisibleOr).maybeSingle(),

  productsByStore: (storeId: string) =>
    supabase
      .from(Db.products)
      .select('*')
      .eq('store_id', storeId)
      .or(productVisibleOr)
      .order('created_at', { ascending: false }),

  searchProductsByName: (pattern: string) =>
    supabase.from(Db.products).select('*').or(productVisibleOr).ilike('name', pattern).limit(20),

  announcements: () =>
    supabase.from(Db.announcements).select('*').eq('active', true).order('created_at', { ascending: false }).limit(5),
};
