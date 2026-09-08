/**
 * homepage controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::homepage.homepage', ({ strapi }) => ({
    async find(ctx) {
        // Read locale from query param (e.g. ?locale=ar or ?locale=en)
        const locale = (ctx.query?.locale as string) || 'en';
        // Read status — 'draft' for Strapi Preview, 'published' for public frontend (default)
        const status = (ctx.query?.status as 'draft' | 'published') === 'draft' ? 'draft' : 'published';
        console.log(status, 'status')
        const data = await strapi.documents('api::homepage.homepage').findFirst({
            locale,
            status,
            populate: ({
                blocks: {
                    on: {
                        'ui.product-scroll-block': {
                            populate: {
                                section: {
                                    fields: ['documentId', 'title', 'style', 'headerStyle', 'cardStyle', 'badge', 'description', 'buttonText', 'buttonLink'],
                                    populate: {
                                        products: {
                                            fields: ['medusaId']
                                        },
                                        image: {
                                            fields: ['url', 'alternativeText', 'width', 'height']
                                        }
                                    }
                                }
                            }
                        },
                        'ui.hero-block': {
                            populate: {
                                section: {
                                    fields: ['documentId', 'title', 'style', 'badge', 'description', 'buttonText', 'buttonLink'],
                                    populate: {
                                        mainImages: {
                                            fields: ['url', 'alternativeText', 'width', 'height']
                                        },
                                        sideImages: {
                                            fields: ['url', 'alternativeText', 'width', 'height']
                                        },
                                        highlights: {
                                            fields: ['text', 'color', 'icon_name']
                                        },
                                        products: {
                                            fields: ['medusaId', 'title', 'subtitle']
                                        }
                                    }
                                }
                            }
                        },
                        'ui.product-showcase-block': {
                            populate: {
                                showcase: {
                                    fields: ['documentId', 'title', 'badge', 'description', 'productCount', 'style', 'headerStyle', 'cardStyle', 'source'],
                                    populate: {
                                        collection: { populate: { collection: { fields: ['medusaId'] } } },
                                        category: { populate: { category: { fields: ['medusaId'] } } },
                                        custom: { populate: { products: { fields: ['medusaId'] } } },
                                        campaign: { populate: { campaign: { fields: ['medusaId', 'endsAt'] } } },
                                        all: { fields: ['filterBy'] }
                                    }
                                }
                            }
                        },
                        'ui.features-block': {
                            populate: {
                                features_section: {
                                    fields: ['documentId', 'style', 'contentType', 'title', 'badge', 'description', 'headerStyle'],
                                    populate: {
                                        features: {
                                            populate: {
                                                icon: {
                                                    fields: ['url', 'alternativeText', 'width', 'height']
                                                }
                                            }
                                        },
                                        testimonials: {
                                            populate: {
                                                avatar: {
                                                    fields: ['url', 'alternativeText', 'width', 'height']
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        'ui.blog-posts-block': {
                            populate: {
                                blog_section: {
                                    fields: ['documentId']
                                }
                            }
                        },
                        'ui.category-collection-block': {
                            populate: {
                                section: {
                                    fields: ['documentId']
                                }
                            }
                        }
                    }
                }
            } as any)
        }) as any;

        // Re-fetch each section in the requested locale (i18n support)
        if (data?.blocks) {
            for (const block of data.blocks) {
                if (block.__component === 'ui.product-scroll-block') {
                    if (block.section?.documentId) {
                        try {
                            const localizedSection = await strapi.documents('api::hp-section-scroll-product.hp-section-scroll-product').findOne({
                                documentId: block.section.documentId,
                                locale,
                                status, // 'published' for public frontend, 'draft' for Strapi Preview
                                fields: ['title', 'style', 'headerStyle', 'cardStyle', 'badge', 'description', 'buttonText', 'buttonLink'],
                                populate: {
                                    products: { fields: ['medusaId'] },
                                    image: { fields: ['url', 'alternativeText', 'width', 'height'] }
                                },
                            });
                            if (localizedSection) {
                                block.section = localizedSection;
                            }
                        } catch (e) {
                            // Fall back to default locale if requested locale is not available
                        }
                    }
                } else if (block.__component === 'ui.hero-block') {
                    if (block.section?.documentId) {
                        try {
                            const localizedHero = await strapi.documents('api::hp-section-hero.hp-section-hero').findOne({
                                documentId: block.section.documentId,
                                locale,
                                status, // 'published' for public frontend, 'draft' for Strapi Preview
                                fields: ['title', 'style', 'badge', 'description', 'buttonText', 'buttonLink'],
                                populate: {
                                    mainImages: { fields: ['url', 'alternativeText', 'width', 'height'] },
                                    sideImages: { fields: ['url', 'alternativeText', 'width', 'height'] },
                                    highlights: { fields: ['text', 'color', 'icon_name'] },
                                    products: { fields: ['medusaId', 'title', 'subtitle'] }
                                },
                            });
                            if (localizedHero) {
                                block.section = localizedHero;
                            }
                        } catch (e) {
                            // Fall back to default locale
                        }
                    }
                } else if (block.__component === 'ui.product-showcase-block') {
                    if (block.showcase?.documentId) {
                        try {
                            const localizedShowcase = await strapi.documents('api::hp-section-showcase.hp-section-showcase').findOne({
                                documentId: block.showcase.documentId,
                                locale,
                                status, // 'published' for public frontend, 'draft' for Strapi Preview
                                fields: ['title', 'badge', 'description', 'productCount', 'style', 'headerStyle', 'cardStyle', 'source'],
                                populate: {
                                    collection: { populate: { collection: { fields: ['medusaId'] } } },
                                    category: { populate: { category: { fields: ['medusaId'] } } },
                                    custom: { populate: { products: { fields: ['medusaId'] } } },
                                    campaign: { populate: { campaign: { fields: ['medusaId', 'endsAt'] } } },
                                    all: { fields: ['filterBy'] }
                                }
                            });
                            if (localizedShowcase) {
                                block.showcase = localizedShowcase;
                            }
                        } catch (e) {
                            // Fall back to default locale
                        }
                    }
                } else if (block.__component === 'ui.features-block') {
                    if (block.features_section?.documentId) {
                        try {
                            const localizedFeatures = await strapi.documents('api::hp-section-feature.hp-section-feature' as any).findOne({
                                documentId: block.features_section.documentId,
                                locale,
                                status, // 'published' for public frontend, 'draft' for Strapi Preview
                                fields: ['style', 'contentType', 'title', 'badge', 'description', 'headerStyle'],
                                populate: {
                                    features: {
                                        populate: {
                                            icon: {
                                                fields: ['url', 'alternativeText', 'width', 'height']
                                            }
                                        }
                                    },
                                    testimonials: {
                                        populate: {
                                            avatar: {
                                                fields: ['url', 'alternativeText', 'width', 'height']
                                            }
                                        }
                                    }
                                }
                            } as any);
                            if (localizedFeatures) {
                                block.features_section = localizedFeatures;
                            }
                        } catch (e) {
                            // Fall back to default locale
                        }
                    }
                } else if (block.__component === 'ui.blog-posts-block') {
                    if (block.blog_section?.documentId) {
                        try {
                            const localizedBlogSection = await strapi.documents('api::hp-section-blog.hp-section-blog' as any).findOne({
                                documentId: block.blog_section.documentId,
                                locale,
                                status, // 'published' for public frontend, 'draft' for Strapi Preview
                                fields: ['title', 'badge', 'description', 'source', 'postCount', 'style', 'headerStyle'],
                                populate: {
                                    posts: {
                                        populate: {
                                            coverImage: {
                                                fields: ['url', 'alternativeText', 'width', 'height']
                                            },
                                            author: {
                                                populate: {
                                                    avatar: {
                                                        fields: ['url', 'alternativeText', 'width', 'height']
                                                    }
                                                }
                                            },
                                            category: {
                                                fields: ['name', 'slug']
                                            }
                                        }
                                    }
                                }
                            } as any);
                            if (localizedBlogSection) {
                                console.log('FETCHED SECTION STATUS:', status, 'TITLE:', localizedBlogSection.title);
                                block.blog_section = localizedBlogSection;
                            }
                        } catch (e) {
                            // Fall back to default locale
                        }
                    }
                } else if (block.__component === 'ui.category-collection-block') {
                    if (block.section?.documentId) {
                        try {
                            const localizedSection = await strapi.documents('api::hp-section-category-collection.hp-section-category-collection' as any).findOne({
                                documentId: block.section.documentId,
                                locale,
                                status,
                                fields: ['title', 'description', 'badge', 'textLink', 'linkUrl', 'style', 'headerStyle'],
                                populate: {
                                    items: {
                                        on: {
                                            'category-collection.category-item': {
                                                populate: {
                                                    category: { fields: ['medusaId', 'name', 'description', 'medusaHandle'] },
                                                    image: { fields: ['url', 'alternativeText', 'width', 'height'] }
                                                }
                                            },
                                            'category-collection.collection-item': {
                                                populate: {
                                                    collection: { fields: ['medusaId', 'title', 'medusaHandle'] },
                                                    image: { fields: ['url', 'alternativeText', 'width', 'height'] }
                                                }
                                            }
                                        }
                                    }
                                }
                            } as any);
                            if (localizedSection) {
                                block.section = localizedSection;
                            }
                        } catch (e) {
                            // Fall back to default locale
                        }
                    }
                }
            }
        }

        return { data };
    }
}));
