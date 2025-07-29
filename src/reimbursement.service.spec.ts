import {
  ApprovedReimbursement,
  IReimbursementRepository,
  Reimbursement,
  ReimbursementCategory,
  ReimbursementService,
  ReimbursementStatus,
  RejectedReimbursement,
} from './reimbursement.service';

// Tests
describe('ReimbursementService unit tests', () => {
  let service: ReimbursementService;
  let repository: jest.Mocked<IReimbursementRepository>;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      create: jest.fn(),
      findOneById: jest.fn(),
      update: jest.fn(),
    } as jest.Mocked<IReimbursementRepository>;

    service = new ReimbursementService(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return list of reimbursements', async () => {
    // Arrange
    const mockReimbursements = [
      {
        id: 'bb8c7d00-4687-4520-9269-6a8f27e9591e',
        employeeId: 'EMP001',
        amount: 100,
        date: new Date(),
        status: ReimbursementStatus.REJECTED,
        category: ReimbursementCategory.MEALS,
        description: 'Dinner expense',
        metadata: {
          category: ReimbursementCategory.MEALS,
          restaurantName: 'McDonalds',
          mealType: 'Lunch',
        },
      },
      {
        id: '19413535-6dab-4399-9994-b7b1359ab131',
        employeeId: 'EMP002',
        amount: 200,
        date: new Date(),
        status: ReimbursementStatus.APPROVED,
        category: ReimbursementCategory.TRAVEL,
        description: 'Travel expense',
        metadata: {
          category: ReimbursementCategory.TRAVEL,
          destination: 'New York',
          purpose: 'Business trip',
          participants: 2,
          singleInsuranceCost: 50,
        },
      },
    ] as Reimbursement[];
    repository.findAll.mockResolvedValue(mockReimbursements);

    // Act
    const reimbursements = await service.getReimbursements();

    // Assert
    expect(repository.findAll).toHaveBeenCalled();
    expect(reimbursements.length).toBe(2);
    expect(reimbursements[0].employeeId).toBe('EMP001');
    expect(reimbursements[1].employeeId).toBe('EMP002');

    const firstReimbursement = reimbursements[0];
    expect(firstReimbursement).toHaveProperty('id');
    expect(firstReimbursement).toHaveProperty('employeeId');
    expect(firstReimbursement).toHaveProperty('amount');
    expect(firstReimbursement).toHaveProperty('date');
    expect(firstReimbursement).toHaveProperty('status');
    expect(firstReimbursement).toHaveProperty('category');
    expect(firstReimbursement).toHaveProperty('description');
  });

  it('should handle successful a request to accept a reimbursement', async () => {
    // Arrange
    const reimbursement = {
      id: 'bb8c7d00-4687-4520-9269-6a8f27e9591e',
      employeeId: 'EMP001',
      amount: 100,
      status: ReimbursementStatus.APPROVED,
      category: ReimbursementCategory.TRAVEL,
      description: 'Travel reimbursement',
    } as ApprovedReimbursement;

    repository.findOneById.mockResolvedValueOnce(reimbursement);

    // Act
    await service.acceptReimbursementRequest(
      'bb8c7d00-4687-4520-9269-6a8f27e9591e',
    );

    // Assert
    expect(repository.update).toHaveBeenCalledWith({
      ...reimbursement,
      status: ReimbursementStatus.APPROVED,
    });
  });

  it('should handle with error a request to accept a reimbursement', async () => {
    // Arrange
    const reimbursement = {
      id: 'bb8c7d00-4687-4520-9269-6a8f27e9591e',
      employeeId: 'EMP001',
      amount: 100,
      status: ReimbursementStatus.REJECTED,
      category: ReimbursementCategory.TRAVEL,
      description: 'Travel reimbursement',
    } as RejectedReimbursement;

    repository.findOneById.mockResolvedValueOnce(reimbursement);

    // Act and Assert
    await expect(
      service.acceptReimbursementRequest(
        'bb8c7d00-4687-4520-9269-6a8f27e9591e',
      ),
    ).rejects.toThrow('Reimbursement is not approved');
  });

  it('should handle successful a request to reject a reimbursement', async () => {
    // Arrange
    const reimbursement = {
      id: 'bb8c7d00-4687-4520-9269-6a8f27e9591e',
      employeeId: 'EMP001',
      amount: 100,
      status: ReimbursementStatus.REJECTED,
      category: ReimbursementCategory.TRAVEL,
      description: 'Travel reimbursement',
    } as RejectedReimbursement;

    repository.findOneById.mockResolvedValueOnce(reimbursement);

    // Act
    await service.rejectReimbursementRequest(
      'bb8c7d00-4687-4520-9269-6a8f27e9591e',
    );

    // Assert
    expect(repository.update).toHaveBeenCalledWith({
      ...reimbursement,
      status: ReimbursementStatus.REJECTED,
    });
  });

  it('should handle with error a request to reject a reimbursement', async () => {
    // Arrange
    const reimbursement = {
      id: 'bb8c7d00-4687-4520-9269-6a8f27e9591e',
      employeeId: 'EMP001',
      amount: 100,
      status: ReimbursementStatus.APPROVED,
      category: ReimbursementCategory.TRAVEL,
      description: 'Travel reimbursement',
    } as ApprovedReimbursement;

    repository.findOneById.mockResolvedValueOnce(reimbursement);

    // Act and Assert
    await expect(
      service.rejectReimbursementRequest(
        'bb8c7d00-4687-4520-9269-6a8f27e9591e',
      ),
    ).rejects.toThrow('Reimbursement is not rejected');
  });

  it('should handle successful a request to update a reimbursement', async () => {
    // Arrange
    const reimbursement = {
      id: 'bb8c7d00-4687-4520-9269-6a8f27e9591e',
      employeeId: 'EMP001',
      amount: 100,
      status: ReimbursementStatus.REJECTED,
      category: ReimbursementCategory.TRAVEL,
      description: 'Travel reimbursement',
    } as RejectedReimbursement;

    repository.findOneById.mockResolvedValueOnce(reimbursement);

    // Act
    await service.updateReimbursementMetadata(
      'bb8c7d00-4687-4520-9269-6a8f27e9591e',
      {
        category: ReimbursementCategory.TRAVEL,
        destination: 'New York',
        purpose: 'Business trip',
        participants: 2,
        singleInsuranceCost: 100,
        totalInsuranceCost: 200,
      },
    );

    // Assert
    expect(repository.update).toHaveBeenCalledWith({
      ...reimbursement,
      metadata: {
        category: ReimbursementCategory.TRAVEL,
        destination: 'New York',
        purpose: 'Business trip',
        participants: 2,
        singleInsuranceCost: 100,
        totalInsuranceCost: 200,
      },
    });
  });

  it('should handle with error a request to update a reimbursement', async () => {
    repository.findOneById.mockResolvedValueOnce(null);

    // Act and Assert
    await expect(
      service.updateReimbursementMetadata(
        'bb8c7d00-4687-4520-9269-6a8f27e9591e',
        {
          category: ReimbursementCategory.MEALS,
          restaurantName: 'McDonalds',
          mealType: 'Lunch',
        },
      ),
    ).rejects.toThrow('Reimbursement not found');
  });
});
