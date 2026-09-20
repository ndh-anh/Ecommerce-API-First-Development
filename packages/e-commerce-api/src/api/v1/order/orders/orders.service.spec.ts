import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { of } from 'rxjs';
import { NotFoundException } from '@nestjs/common';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const orderId = '123e4567-e89b-12d3-a456-426614174A00';
const userId = '123e4567-e89b-12d3-a456-426614174B00';

const mockOrder = {
  orderId,
  userId,
  status: 'PENDING',
  totalAmount: 100,
  totalDiscount: 10,
  finalAmount: 90,
  createdAt: '2026-05-03T00:00:00.000Z',
};

const mockOrdersResponse = {
  orders: [mockOrder],
  totalCount: 1,
  totalPages: 1,
};

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockOrderServiceClient = {
  createOrder: jest.fn(),
  getOrders: jest.fn(),
  getOrderById: jest.fn(),
  deleteOrder: jest.fn(),
};

const mockClientGrpc = {
  getService: jest.fn().mockReturnValue(mockOrderServiceClient),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: 'ORDER_SERVICE',
          useValue: mockClientGrpc,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    // Explicitly call onModuleInit to initialize the gRPC client
    service.onModuleInit();

    jest.clearAllMocks();
  });

  // ─── deleteOrder ─────────────────────────────────────────────────────────────

  describe('deleteOrder', () => {
    it('should call gRPC deleteOrder with correct params', async () => {
      mockOrderServiceClient.deleteOrder.mockReturnValue(of({ success: true }));

      await service.deleteOrder({ orderId });

      expect(mockOrderServiceClient.deleteOrder).toHaveBeenCalledTimes(1);
      expect(mockOrderServiceClient.deleteOrder).toHaveBeenCalledWith({
        order_id: orderId,
      });
    });

    it('should throw NotFoundException if gRPC returns success: false', async () => {
      mockOrderServiceClient.deleteOrder.mockReturnValue(
        of({ success: false }),
      );

      await expect(service.deleteOrder({ orderId })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── getOrderById ────────────────────────────────────────────────────────────

  describe('getOrderById', () => {
    it('should return an order from gRPC client', async () => {
      mockOrderServiceClient.getOrderById.mockReturnValue(
        of({ order: mockOrder }),
      );

      const result = await service.getOrderById({ orderId });

      expect(mockOrderServiceClient.getOrderById).toHaveBeenCalledTimes(1);
      expect(mockOrderServiceClient.getOrderById).toHaveBeenCalledWith({
        order_id: orderId,
      });
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException if gRPC returns no order', async () => {
      mockOrderServiceClient.getOrderById.mockReturnValue(of({ order: null }));

      await expect(service.getOrderById({ orderId })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── getOrders ───────────────────────────────────────────────────────────────

  describe('getOrders', () => {
    it('should return orders from gRPC client', async () => {
      mockOrderServiceClient.getOrders.mockReturnValue(of(mockOrdersResponse));

      const query = { page: 1, pageSize: 20, userId };
      const result = await service.getOrders(query);

      expect(mockOrderServiceClient.getOrders).toHaveBeenCalledTimes(1);
      expect(mockOrderServiceClient.getOrders).toHaveBeenCalledWith({
        user_id: query.userId,
        status: undefined,
        page: query.page,
        page_size: query.pageSize,
        order_by: undefined,
      });
      expect(result).toEqual(mockOrdersResponse);
    });
  });

  // ─── postOrder ───────────────────────────────────────────────────────────────

  describe('postOrder', () => {
    it('should call gRPC createOrder and return id', async () => {
      mockOrderServiceClient.createOrder.mockReturnValue(of({ orderId }));

      const body = { userId };
      const result = await service.postOrder(body);

      expect(mockOrderServiceClient.createOrder).toHaveBeenCalledTimes(1);
      expect(mockOrderServiceClient.createOrder).toHaveBeenCalledWith({
        user_id: userId,
      });
      expect(result).toEqual({ orderId });
    });
  });
});
