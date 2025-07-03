import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import request from "supertest"
import { TypeOrmModule } from "@nestjs/typeorm"
import { BuyerRequestsModule } from "../buyer-requests.module"
import { BuyerRequest } from "../entities/buyer-request.entity"

describe("BuyerRequestsController (e2e)", () => {
  let app: INestApplication

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [BuyerRequest],
          synchronize: true,
        }),
        BuyerRequestsModule,
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it("/buyer-requests (GET) should return empty array initially", () => {
    return request(app.getHttpServer())
      .get("/buyer-requests")
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toEqual([])
        expect(res.body.total).toBe(0)
      })
  })

  // Note: These tests would need proper authentication setup
  // For now, they serve as examples of the expected behavior
})
