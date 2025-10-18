// src/app/merch/page.tsx

import Image from 'next/image';
import NoPrefetchLink from '@/components/common/NoPrefetchLink';
import React from 'react';
import styles from '@/styles/MerchPage.module.css';
import base from '@/styles/Base.module.css';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// --- Type Definitions ---
type ProductVariant = {
  id: string;
  name?: string;
  options?: { id: string; name: string }[];
  unitPrice: { value: number; currency: string };
};
type ProductImage = { id: string; url: string; altText?: string };
type Product = {
  id: string;
  name: string;
  description: string;
  slug: string;
  images: ProductImage[];
  variants: ProductVariant[];
};
type Collection = { id: string; name: string; slug: string };

interface RawProductData {
  id?: string;
  name?: string;
  description?: string;
  slug?: string;
  images?: any[];
  variants?: any[];
}

// --- Helper ---
function decodeHtmlEntities(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'");
}

// --- Server Component ---
export default async function HelldiversMerchPage() {
  const token = process.env.STOREFRONT_API_TOKEN;
  let products: Product[] = [];
  let errorOccurred = false;
  let errorMessage = 'Failed to load products.';

  if (!token) {
    logger.error(
      'Error: STOREFRONT_API_TOKEN environment variable is not set.'
    );
    errorOccurred = true;
    errorMessage = 'Store configuration error. Please contact support.';
  }

  if (!errorOccurred) {
    try {
      logger.info('Fetching collections...');
      const colRes = await fetch(
        `https://storefront-api.fourthwall.com/v1/collections?storefront_token=${token}`,
        { next: { revalidate: 3600 } }
      );
      if (!colRes.ok) {
        const errorBody = await colRes.text();
        logger.error(
          `Collections fetch failed: ${colRes.status} ${colRes.statusText}`,
          errorBody
        );
        throw new Error(`Collections fetch failed: ${colRes.status}`);
      }
      const colData = await colRes.json();
      const collections: Collection[] = colData.results || [];
      logger.info(`Found ${collections.length} collections.`);

      const targetCollectionSlug = 'all';
      const targetCollection =
        collections.find((col) => col.slug === targetCollectionSlug) ||
        (collections.length > 0 ? collections[0] : null);

      if (!targetCollection) {
        logger.warn(
          `Target collection '${targetCollectionSlug}' not found or store has no collections.`
        );
      } else {
        logger.info(
          `Fetching products for collection: ${targetCollection.name} (slug: ${targetCollection.slug})...`
        );
        const prodRes = await fetch(
          `https://storefront-api.fourthwall.com/v1/collections/${targetCollection.slug}/products?storefront_token=${token}`,
          { next: { revalidate: 3600 } }
        );
        if (!prodRes.ok) {
          const errorBody = await prodRes.text();
          logger.error(
            `Products fetch failed: ${prodRes.status} ${prodRes.statusText}`,
            errorBody
          );
          throw new Error(`Products fetch failed: ${prodRes.status}`);
        }
        const prodData = await prodRes.json();

        products = (prodData.results || [])
          .map(
            (p: RawProductData): Product => ({
              id:
                p?.id ||
                `unknown-${Math.random().toString(36).substring(2, 9)}`,
              name: p?.name || 'Unnamed Product',
              description: p?.description || '',
              slug: p?.slug || '',
              images: Array.isArray(p?.images)
                ? p.images
                    .map((img: any) => ({
                      id:
                        img?.id ||
                        `img-${Math.random().toString(36).substring(2, 9)}`,
                      url: img?.url || '',
                      altText: img?.altText || '',
                    }))
                    .filter((img) => img.url)
                : [],
              variants: Array.isArray(p?.variants)
                ? p.variants
                    .map((v: any) => ({
                      id:
                        v?.id ||
                        `var-${Math.random().toString(36).substring(2, 9)}`,
                      name: v?.name,
                      options: v?.options,
                      unitPrice: {
                        value:
                          typeof v?.unitPrice?.value === 'number'
                            ? v.unitPrice.value
                            : 0,
                        currency: v?.unitPrice?.currency || 'USD',
                      },
                    }))
                    .filter((v) => v.unitPrice.value > 0)
                : [],
            })
          )
          .filter(
            (p: Product): p is Product => !!p.slug && p.variants.length > 0
          );

        logger.info(`Fetched ${products.length} valid products.`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        logger.error('Error fetching Fourthwall products:', err.message);
        errorMessage = `Failed to load products due to a network or API error. (Details: ${err.message})`;
      } else {
        logger.error('An unexpected error occurred:', err);
        errorMessage = 'An unexpected error occurred while loading products.';
      }
      errorOccurred = true;
      products = [];
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.dividerLayer} />
      <main className={styles.merchMainContainer}>
        {/* Keep an accessible heading for SEO without visible marketing copy */}
        <h1 className={base.visuallyHidden}>GPT Fleet Store</h1>

        {errorOccurred ? (
          <div className={styles.merchErrorText}>{errorMessage}</div>
        ) : products.length === 0 && !errorOccurred ? (
          <div className={styles.merchMessageText}>
            No products available in this collection.
          </div>
        ) : (
          <div className={styles.merchProductListContainer}>
            {products.map((product, index) => {
              let formattedPrice = '';
              const firstVariant = product.variants?.[0];
              if (
                firstVariant?.unitPrice &&
                typeof firstVariant.unitPrice.value === 'number'
              ) {
                const priceInfo = firstVariant.unitPrice;
                const priceValue = priceInfo.value;
                try {
                  formattedPrice = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: priceInfo.currency || 'USD',
                  }).format(priceValue);
                } catch {
                  formattedPrice = `$${priceValue.toFixed(2)} ${priceInfo.currency || 'USD'}`;
                }
              }

              const imageUrl = product.images?.[0]?.url;
              const imageAlt =
                product.images?.[0]?.altText || product.name || 'Product image';
              let cleanDescription = 'No description available.';
              if (product.description) {
                try {
                  cleanDescription = decodeHtmlEntities(
                    product.description
                  ).replace(/<[^>]*>?/gm, '');
                } catch (e) {
                  logger.warn('Could not decode/clean description for', {
                    productName: product.name,
                    error: e,
                  });
                  cleanDescription = product.description.replace(
                    /<[^>]*>?/gm,
                    ''
                  );
                }
              }

              return (
                <NoPrefetchLink
                  key={product.id}
                  href={`https://gptfleet-shop.fourthwall.com/products/${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.merchProductCardLink}
                  title={`View ${product.name} in store`}
                >
                  <div className={styles.merchImageContainer}>
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={imageAlt}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className={styles.merchProductImage}
                        priority={index < 4}
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className={styles.merchImagePlaceholder}>
                        No Image
                      </div>
                    )}
                  </div>
                  <div className={styles.merchDetailsContainer}>
                    <h2
                      className={styles.merchProductName}
                      title={product.name}
                    >
                      {product.name}
                    </h2>
                    <p className={styles.merchProductDescription}>
                      {cleanDescription}
                    </p>
                    {formattedPrice && (
                      <p className={styles.merchProductPrice}>
                        {formattedPrice}
                      </p>
                    )}
                  </div>
                </NoPrefetchLink>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
