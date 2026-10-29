export interface SampleImage {
  id: string;
  title: string;
  category: string;
  dimensions: string;
  url: string;
  filename: string;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'sample-landscape',
    title: 'Alpine Lake & Peaks',
    category: 'Landscape / High Resolution',
    dimensions: '1920 × 1080',
    url: '/src/assets/images/sample_mountain_landscape_1793268223622.jpg',
    filename: 'alpine_mountain_lake.jpg'
  },
  {
    id: 'sample-portrait',
    title: 'Studio Portrait',
    category: 'Portrait / Editorial',
    dimensions: '1440 × 1080',
    url: '/src/assets/images/sample_studio_portrait_1793268223010.jpg',
    filename: 'studio_portrait.jpg'
  },
  {
    id: 'sample-product',
    title: 'Modern Athletic Sneaker',
    category: 'Product / E-commerce',
    dimensions: '1024 × 1024',
    url: '/src/assets/images/sample_product_sneaker_1793268223348.jpg',
    filename: 'athletic_sneaker_product.jpg'
  }
];

export async function fetchSampleAsFile(sample: SampleImage): Promise<File> {
  const response = await fetch(sample.url);
  const blob = await response.blob();
  return new File([blob], sample.filename, { type: blob.type || 'image/jpeg' });
}
