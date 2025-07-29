import {
    IReimbursementRepository,
    ReimbursementCategory,
    ReimbursementService,
    ReimbursementStatus,
} from './reimbursement.service';

// Tests
describe('ReimbursementService unit tests', () => {
    let service: ReimbursementService;
    let repository: IReimbursementRepository;

    beforeEach(() => {
        repository = {
            findAll: jest.fn(),
            create: jest.fn(),
            getReimbursement: jest.fn(),
            update: jest.fn(),
        };
        service = new ReimbursementService(repository);
    });

    it('should return list of reimbursements', async () => {
        // Act
        const reimbursements = await service.getReimbursements();

        // Assert
        expect(reimbursements.length).toBe(2);
        expect(reimbursements[0].employeeId).toBe('EMP001');
        expect(reimbursements[1].employeeId).toBe('EMP002');
    });

    it('should have correct data structure', async () => {
        // Act
        const reimbursements = await service.getReimbursements();
        const firstReimbursement = reimbursements[0];

        // Assert
        expect(firstReimbursement).toHaveProperty('id');
        expect(firstReimbursement).toHaveProperty('employeeId');
        expect(firstReimbursement).toHaveProperty('amount');
        expect(firstReimbursement).toHaveProperty('date');
        expect(firstReimbursement).toHaveProperty('status');
        expect(firstReimbursement).toHaveProperty('category');
        expect(firstReimbursement).toHaveProperty('description');
    });

    it('should accept a reimbursement request', async () => {
        // Arrange
        const reimbursement = {
            id: 1,
            employeeId: 'EMP001',
            amount: 100,
            date: new Date(),
            status: ReimbursementStatus.PENDING,
            category: ReimbursementCategory.TRAVEL,
            description: 'Travel reimbursement',
        };

        repository.findAll.mockResolvedValueOnce([reimbursement]);

        // Act
        await service.acceptReimbursementRequest(1);

        // Assert
        expect(repository.update).toHaveBeenCalledWith({
            ...reimbursement,
            status: ReimbursementStatus.APPROVED,
        });
    });
});
