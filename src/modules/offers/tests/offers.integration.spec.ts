import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import request from "supertest"
import { TypeOrmModule } from "@nestjs/typeorm"
import { OffersModule } from "../offers.module"
import { AuthModule } from "../../auth/auth.module"
import { UsersModule } from "../../users/users.module"
import { BuyerRequestsModule } from "../../buyer-requests/buyer-requests.module"

describe("Offers Integration Tests", () => {
  let app: INestApplication
  let authToken: string
  let sellerId: string
  let offerId: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [__dirname + "/../**/*.entity{.ts,.js}"],
          synchronize: true,
        }),
        OffersModule,
        AuthModule,
        UsersModule,
        BuyerRequestsModule,
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    // Setup test data and authentication
    // This would typically involve creating test users, buyer requests, etc.
  })

  afterAll(async () => {
    await app.close()
  })

  describe("POST /offers/:id/attachments", () => {
    it("should upload attachment to offer", async () => {
      const response = await request(app.getHttpServer())
        .post(`/offers/${offerId}/attachments`)
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", Buffer.from("test image data"), "test.jpg")
        .expect(201)

      expect(response.body).toHaveProperty("id")
      expect(response.body).toHaveProperty("fileUrl")
      expect(response.body.fileType).toBe("image")
      expect(response.body.fileName).toBe("test.jpg")
    })

    it("should reject invalid file types", async () => {
      await request(app.getHttpServer())
        .post(`/offers/${offerId}/attachments`)
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", Buffer.from("test data"), "test.txt")
        .expect(400)
    })

    it("should reject files that are too large", async () => {
      const largeBuffer = Buffer.alloc(15 * 1024 * 1024) // 15MB

      await request(app.getHttpServer())
        .post(`/offers/${offerId}/attachments`)
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", largeBuffer, "large.jpg")
        .expect(400)
    })

    it("should reject unauthorized requests", async () => {
      await request(app.getHttpServer())
        .post(`/offers/${offerId}/attachments`)
        .attach("file", Buffer.from("test image data"), "test.jpg")
        .expect(401)
    })
  })

  describe("GET /offers/:id/attachments", () => {
    it("should return offer attachments", async () => {
      const response = await request(app.getHttpServer()).get(`/offers/${offerId}/attachments`).expect(200)

      expect(Array.isArray(response.body)).toBe(true)
    })

    it("should return 404 for non-existent offer", async () => {
      await request(app.getHttpServer()).get("/offers/non-existent/attachments").expect(404)
    })
  })

  describe("DELETE /offers/attachments/:attachmentId", () => {
    let attachmentId: string

    beforeEach(async () => {
      // Create an attachment for testing
      const uploadResponse = await request(app.getHttpServer())
        .post(`/offers/${offerId}/attachments`)
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", Buffer.from("test image data"), "test.jpg")

      attachmentId = uploadResponse.body.id
    })

    it("should delete attachment successfully", async () => {
      await request(app.getHttpServer())
        .delete(`/offers/attachments/${attachmentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
    })

    it("should reject unauthorized deletion attempts", async () => {
      await request(app.getHttpServer()).delete(`/offers/attachments/${attachmentId}`).expect(401)
    })
  })
})
