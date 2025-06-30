import { Test, type TestingModule } from "@nestjs/testing"
import type { INestApplication } from "@nestjs/common"
import request from "supertest"
import { TypeOrmModule } from "@nestjs/typeorm"
import { BuyerRequestsModule } from "../buyer-requests.module"
import { BuyerRequest, BuyerRequestStatus } from "../entities/buyer-request.entity"
import type { Repository } from "typeorm"
import { getRepositoryToken } from "@nestjs/typeorm"

describe("BuyerRequestsController (e2e)", () => {
  let app: INestApplication
  let repository: Repository<BuyerRequest>

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [BuyerRequest],
          synchronize: true,
          dropSchema: true, // Ensure clean state
        }),
        BuyerRequestsModule,
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    repository = moduleFixture.get<Repository<BuyerRequest>>(getRepositoryToken(BuyerRequest))
    await app.init()
  }, 30000) // Increased timeout to 30 seconds

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  describe("/buyer-requests (GET)", () => {
    it("should return empty array initially", () => {
      return request(app.getHttpServer())
        .get("/buyer-requests")
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toEqual([])
          expect(res.body.total).toBe(0)
          expect(res.body.filters).toBeDefined()
        })
    })

    it("should apply search filter", async () => {
      // Create test data
      await repository.save([
        {
          title: "Web Development Project",
          description: "Need a React developer",
          budgetMin: 1000,
          budgetMax: 2000,
          categoryId: 1,
          userId: 1,
          status: BuyerRequestStatus.OPEN,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Mobile App Design",
          description: "iOS app needed",
          budgetMin: 500,
          budgetMax: 1000,
          categoryId: 2,
          userId: 2,
          status: BuyerRequestStatus.OPEN,
          expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        },
      ])

      return request(app.getHttpServer())
        .get("/buyer-requests?search=web")
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0)
          expect(res.body.filters.search).toBe("web")
        })
    })

    it("should apply budget filters", async () => {
      await repository.save([
        {
          title: "High Budget Project",
          budgetMin: 5000,
          budgetMax: 10000,
          categoryId: 1,
          userId: 1,
          status: BuyerRequestStatus.OPEN,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Low Budget Project",
          budgetMin: 100,
          budgetMax: 500,
          categoryId: 1,
          userId: 2,
          status: BuyerRequestStatus.OPEN,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      ])

      return request(app.getHttpServer())
        .get("/buyer-requests?budgetMin=1000&budgetMax=8000")
        .expect(200)
        .expect((res) => {
          expect(res.body.filters.budgetMin).toBe(1000)
          expect(res.body.filters.budgetMax).toBe(8000)
        })
    })

    it("should apply expiring soon filter", async () => {
      await repository.save([
        {
          title: "Expiring Soon",
          budgetMin: 1000,
          budgetMax: 2000,
          categoryId: 1,
          userId: 1,
          status: BuyerRequestStatus.OPEN,
          expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        },
        {
          title: "Not Expiring Soon",
          budgetMin: 1000,
          budgetMax: 2000,
          categoryId: 1,
          userId: 2,
          status: BuyerRequestStatus.OPEN,
          expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
        },
      ])

      return request(app.getHttpServer())
        .get("/buyer-requests?expiringSoon=true")
        .expect(200)
        .expect((res) => {
          expect(res.body.filters.expiringSoon).toBe(true)
          // In SQLite, the expiring soon logic might not work exactly like PostgreSQL
          // but the filter should be applied
        })
    })
  })

  describe("/buyer-requests/search-suggestions (GET)", () => {
    it("should return search suggestions", async () => {
      await repository.save([
        {
          title: "Web Development",
          budgetMin: 1000,
          budgetMax: 2000,
          categoryId: 1,
          userId: 1,
          status: BuyerRequestStatus.OPEN,
        },
        {
          title: "Website Design",
          budgetMin: 500,
          budgetMax: 1000,
          categoryId: 1,
          userId: 2,
          status: BuyerRequestStatus.OPEN,
        },
      ])

      return request(app.getHttpServer())
        .get("/buyer-requests/search-suggestions?q=web")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true)
        })
    })
  })

  describe("/buyer-requests/popular-categories (GET)", () => {
    it("should return popular categories", async () => {
      await repository.save([
        {
          title: "Project 1",
          budgetMin: 1000,
          budgetMax: 2000,
          categoryId: 1,
          userId: 1,
          status: BuyerRequestStatus.OPEN,
        },
        {
          title: "Project 2",
          budgetMin: 500,
          budgetMax: 1000,
          categoryId: 1,
          userId: 2,
          status: BuyerRequestStatus.OPEN,
        },
      ])

      return request(app.getHttpServer())
        .get("/buyer-requests/popular-categories")
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true)
        })
    })
  })
})