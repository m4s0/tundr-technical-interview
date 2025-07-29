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

export type TravelReimbursementMetadata = {
  category: ReimbursementCategory.TRAVEL;
  destination: string;
  purpose: string;
  participants: number;
  singleInsuranceCost: number;
  totalInsuranceCost?: number; // calculated field
};

export type MealsReimbursementMetadata = {
  category: ReimbursementCategory.MEALS;
  restaurantName: string;
  mealType: string;
};

export type ReimbursementMetadata =
  | TravelReimbursementMetadata
  | MealsReimbursementMetadata;

type BaseReimbursement = {
  id: string;
  employeeId: string;
  amount: number;
  date: Date;
  category: ReimbursementCategory;
  metadata: ReimbursementMetadata;
  description: string;
};

export type PendingReimbursement = BaseReimbursement & {
  status: ReimbursementStatus.PENDING;
};

export type ApprovedReimbursement = BaseReimbursement & {
  status: ReimbursementStatus.APPROVED;
  approvedAt: Date;
};

export type RejectedReimbursement = BaseReimbursement & {
  status: ReimbursementStatus.REJECTED;
  rejectedAt: Date;
};

export type Reimbursement =
  | PendingReimbursement
  | ApprovedReimbursement
  | RejectedReimbursement;

export function isApprovedReimbursement(
  reimbursement: Reimbursement,
): reimbursement is ApprovedReimbursement {
  return reimbursement.status === ReimbursementStatus.APPROVED;
}

export function isRejectedReimbursement(
  reimbursement: Reimbursement,
): reimbursement is RejectedReimbursement {
  return reimbursement.status === ReimbursementStatus.REJECTED;
}

export function isTravelMetadata(
  metadata: ReimbursementMetadata,
): metadata is TravelReimbursementMetadata {
  return metadata.category === ReimbursementCategory.TRAVEL;
}

export function isMealsMetadata(
  metadata: ReimbursementMetadata,
): metadata is MealsReimbursementMetadata {
  return metadata.category === ReimbursementCategory.MEALS;
}

// Repository implementation is out of scope for this PR
export interface IReimbursementRepository {
  findAll(): Promise<Reimbursement[]>;

  create(reimbursement: Reimbursement): Promise<Reimbursement>;

  findOneById(reimbursementId: string): Promise<Reimbursement | null>;

  update(reimbursement: Reimbursement): Promise<Reimbursement>;
}

export interface IReimbursementService {
  getReimbursements(): Promise<Reimbursement[]>;

  createReimbursementRequest(
    reimbursement: Reimbursement,
  ): Promise<Reimbursement>;

  acceptReimbursementRequest(reimbursementId: string): Promise<void>;

  rejectReimbursementRequest(reimbursementId: string): Promise<void>;

  updateReimbursementMetadata(
    reimbursementId: string,
    metadata: ReimbursementMetadata,
  ): Promise<Reimbursement>;
}

export class ReimbursementService implements IReimbursementService {
  constructor(
    private readonly reimbursementRepository: IReimbursementRepository,
  ) {}

  async getReimbursements(): Promise<Reimbursement[]> {
    return this.reimbursementRepository.findAll();
  }

  async createReimbursementRequest(
    reimbursement: Reimbursement,
  ): Promise<Reimbursement> {
    return this.reimbursementRepository.create({
      ...reimbursement,
      status: ReimbursementStatus.PENDING,
    });
  }

  async acceptReimbursementRequest(reimbursementId: string): Promise<void> {
    const reimbursement =
      await this.reimbursementRepository.findOneById(reimbursementId);
    if (!reimbursement) {
      throw new Error('Reimbursement not found');
    }
    if (!isApprovedReimbursement(reimbursement)) {
      throw new Error('Reimbursement is not approved');
    }

    reimbursement.status = ReimbursementStatus.APPROVED;
    reimbursement.approvedAt = new Date();
    await this.reimbursementRepository.update(reimbursement);
  }

  async rejectReimbursementRequest(reimbursementId: string): Promise<void> {
    const reimbursement =
      await this.reimbursementRepository.findOneById(reimbursementId);
    if (!reimbursement) {
      throw new Error('Reimbursement not found');
    }
    if (!isRejectedReimbursement(reimbursement)) {
      throw new Error('Reimbursement is not rejected');
    }

    reimbursement.status = ReimbursementStatus.REJECTED;
    reimbursement.rejectedAt = new Date();
    await this.reimbursementRepository.update(reimbursement);
  }

  async updateReimbursementMetadata(
    reimbursementId: string,
    metadata: ReimbursementMetadata,
  ): Promise<Reimbursement> {
    const reimbursement =
      await this.reimbursementRepository.findOneById(reimbursementId);
    if (!reimbursement) {
      throw new Error('Reimbursement not found');
    }

    reimbursement.metadata = metadata;
    if (isTravelMetadata(reimbursement.metadata)) {
      reimbursement.metadata.totalInsuranceCost =
        reimbursement.metadata.singleInsuranceCost *
        reimbursement.metadata.participants;
    }

    await this.reimbursementRepository.update(reimbursement);

    return reimbursement;
  }
}
