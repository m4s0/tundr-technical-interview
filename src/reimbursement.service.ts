// Interfaces
export interface TravelReimbursementMetadata {
    destination: string;
    purpose: string;
    participants: number;
    singleInsuranceCost: number;
    totalInsuranceCost?: number; // calculated field
}

export interface MealsReimbursementMetadata {
    restaurantName: string;
    mealType: string;
}

export interface Reimbursement {
    id: number;
    employeeId: string;
    amount: number;
    date: Date;
    status: ReimbursementStatus;
    category: ReimbursementCategory;
    metadata: TravelReimbursementMetadata | MealsReimbursementMetadata;
    description: string;
    approvedAt?: Date;
    rejectedAt?: Date;
}

export enum ReimbursementStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export enum ReimbursementCategory {
    TRAVEL = 'TRAVEL',
    MEALS = 'MEALS',
    SUPPLIES = 'SUPPLIES',
    OTHER = 'OTHER',
}

// Repository implementation is out of scope for this PR
export interface IReimbursementRepository {
    findAll(): Promise<Reimbursement[]>;

    create(reimbursement: Reimbursement): Promise<Reimbursement>;

    getReimbursement(reimbursementId: string): Promise<Reimbursement>;

    update(reimbursement: Reimbursement): Promise<Reimbursement>;
}

export interface IReimbursementService {
    getReimbursements(): Promise<Reimbursement[]>;

    createReimbursementRequest(
        reimbursement: Reimbursement,
    ): Promise<Reimbursement>;

    acceptReimbursementRequest(reimbursementId: number): Promise<boolean>;

    rejectReimbursementRequest(reimbursementId: number): Promise<boolean>;
}

export class ReimbursementService {
    constructor(
        private readonly reimbursementRepository: IReimbursementRepository,
    ) {
    }

    async getReimbursements(): Promise<Reimbursement[]> {
        return await this.reimbursementRepository.findAll();
    }

    async createReimbursementRequest(reimbursement): Promise<Reimbursement> {
        const r = this.reimbursementRepository.create({
            ...reimbursement,
            status: ReimbursementStatus.PENDING,
        });
        return r;
    }

    async acceptReimbursementRequest(reimbursementId: number): Promise<boolean> {
        const reimbursements = await this.reimbursementRepository.findAll();
        const r = reimbursements.find((r) => r.id === reimbursementId);
        if (r) {
            r.status = ReimbursementStatus.APPROVED;
            r.approvedAt = new Date();
            await this.reimbursementRepository.update(r);
            return true;
        }
        return false;
    }

    async rejectReimbursementRequest(reimbursementId: number): Promise<boolean> {
        const reimbursements = await this.reimbursementRepository.findAll();
        const r = reimbursements.find((r) => r.id === reimbursementId);
        if (r) {
            r.status = ReimbursementStatus.REJECTED;
            await this.reimbursementRepository.update(r);
            return true;
        }
        return false;
    }

    async updateReimbursementMetadata(
        reimbursementId: number,
        metadata: TravelReimbursementMetadata | MealsReimbursementMetadata,
    ): Promise<Reimbursement> {
        const reimbursements = await this.reimbursementRepository.findAll();
        const reimbursement = reimbursements.find((r) => r.id === reimbursementId);
        if (reimbursement) {
            reimbursement.metadata = metadata;
            if (reimbursement.category === ReimbursementCategory.TRAVEL) {
                (
                    reimbursement.metadata as TravelReimbursementMetadata
                ).totalInsuranceCost =
                    (reimbursement.metadata as TravelReimbursementMetadata)
                        .singleInsuranceCost *
                    (reimbursement.metadata as TravelReimbursementMetadata).participants;
            }
            await this.reimbursementRepository.update(reimbursement);
            return reimbursement;
        }
        throw new Error('Reimbursement not found');
    }
}
