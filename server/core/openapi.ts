// ─────────────────────────────────────────────────────────────────────────────
// server/core/openapi.ts
// OpenAPI 3.1.0 Contract Specification for FasalDost Modular Monolith
// ─────────────────────────────────────────────────────────────────────────────

export const openApiSpecification = {
  openapi: '3.1.0',
  info: {
    title: 'FasalDost Enterprise REST API',
    version: '2.0.0',
    description:
      'High-performance agricultural intelligence, crop diagnosis, and genuine kisan produce marketplace API contract. Backed by PostgreSQL, S3 Object Storage, Redis, BullMQ, and OpenTelemetry.',
    contact: {
      name: 'FasalDost Engineering',
      url: 'https://fasaldost.pk',
    },
  },
  servers: [
    {
      url: '/',
      description: 'Default API Gateway',
    },
  ],
  paths: {
    '/api/health': {
      get: {
        summary: 'System Health Check & Diagnostic Status',
        description: 'Returns health status of PostgreSQL, Redis cache, and S3 storage.',
        responses: {
          '200': {
            description: 'System is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    uptime: { type: 'number' },
                    timestamp: { type: 'string' },
                    services: {
                      type: 'object',
                      properties: {
                        database: { type: 'string', example: 'connected' },
                        redis: { type: 'string', example: 'ready' },
                        storage: { type: 'string', example: 's3_compatible' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register-send-otp': {
      post: {
        summary: 'Send 6-Digit Email OTP for Registration',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'phone', 'fullName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  fullName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'OTP dispatched to email' },
          '400': { description: 'Validation error or disposable email rejected' },
        },
      },
    },
    '/api/auth/register-verify-otp': {
      post: {
        summary: 'Verify 6-Digit OTP and Complete User Registration',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'otp', 'password', 'fullName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  otp: { type: 'string', example: '123456' },
                  password: { type: 'string', minLength: 6 },
                  fullName: { type: 'string' },
                  phone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Registration completed and authenticated' },
          '400': { description: 'Invalid or expired OTP code' },
        },
      },
    },
    '/api/diagnostics/detect': {
      post: {
        summary: 'Run AI Disease Detection on Crop Leaf Image',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['imageBase64'],
                properties: {
                  imageBase64: { type: 'string', description: 'Base64 image string' },
                  cropName: { type: 'string', example: 'Wheat' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Detailed diagnosis, disease identification, cure & prevention plan' },
        },
      },
    },
    '/api/marketplace/listings': {
      get: {
        summary: 'Fetch Active Produce Listings (3-Per-Row Feed)',
        parameters: [
          { name: 'cropName', in: 'query', schema: { type: 'string' } },
          { name: 'province', in: 'query', schema: { type: 'string' } },
          { name: 'district', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: {
          '200': { description: 'List of verified farmer produce listings' },
        },
      },
      post: {
        summary: 'Create New Produce Listing (Requires Verified Seller Status)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['cropName', 'price', 'quantity', 'unit', 'province'],
                properties: {
                  cropName: { type: 'string' },
                  variety: { type: 'string' },
                  price: { type: 'number' },
                  quantity: { type: 'number' },
                  unit: { type: 'string', example: 'Maund' },
                  province: { type: 'string' },
                  district: { type: 'string' },
                  images: { type: 'array', items: { type: 'string' } },
                  videos: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Listing created successfully' },
          '403': { description: 'Farmer must be CNIC verified to sell produce' },
        },
      },
    },
    '/api/search': {
      get: {
        summary: 'Dedicated Full-Text Search Engine Query',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search term' },
          { name: 'category', in: 'query', schema: { type: 'string', enum: ['all', 'crops', 'diseases', 'marketplace', 'farmers'] } },
          { name: 'province', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'Ranked search hits with facets and latency metrics' },
        },
      },
    },
    '/api/farmers/verify-seller': {
      post: {
        summary: 'Submit CNIC & Selfie Verification for Seller Badge',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'phoneNumber', 'email', 'cnicNumber', 'profilePhotoDataUrl', 'cnicFrontDataUrl', 'cnicBackDataUrl', 'declarationAccepted'],
                properties: {
                  fullName: { type: 'string' },
                  phoneNumber: { type: 'string' },
                  email: { type: 'string' },
                  cnicNumber: { type: 'string', example: '35201-1234567-1' },
                  province: { type: 'string' },
                  district: { type: 'string' },
                  landSizeAcres: { type: 'string' },
                  profilePhotoDataUrl: { type: 'string' },
                  cnicFrontDataUrl: { type: 'string' },
                  cnicBackDataUrl: { type: 'string' },
                  declarationAccepted: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Verification submitted, AI inspected, and verified' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};
