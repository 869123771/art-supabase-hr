declare namespace Api {
  namespace Hr {
    type EmploymentStatus = 'probation' | 'active' | 'leave' | 'terminated'
    type EmploymentType = 'full_time' | 'part_time' | 'intern' | 'contractor'
    type JobArchitectureEntity = 'family' | 'grade' | 'profile'
    type EmployeeFieldKey =
      | 'contactDetails'
      | 'identityDetails'
      | 'compensationDetails'
      | 'careerRecords'
      | 'maintenanceAudit'
    type EmployeeFieldAccessMap = Partial<Record<EmployeeFieldKey, Api.Common.FieldAccessLevel>>
    type ProtectedAmount = number | string | null

    interface Position {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      positionCode: string
      positionName: string
      organizationId?: string | null
      organization?: Pick<
        SystemManage.OrganizationListItem,
        'id' | 'organizationCode' | 'organizationName'
      > | null
      jobProfileId: string
      jobProfile?: Pick<JobProfile, 'id' | 'jobCode' | 'jobName'> | null
      gradeId?: string | null
      grade?: Pick<Grade, 'id' | 'gradeCode' | 'gradeName'> | null
      headcountLimit: number
      multipleIncumbentsAllowed: boolean
      enabled: boolean
      sort: number
      description?: string | null
      employeeCount?: number
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    type PositionSearchParams = Partial<
      Pick<Position, 'tenantId' | 'enabled'> &
        Api.Common.CommonSearchParams & {
          keyword?: string
          organizationIds?: string[]
        }
    >

    interface PositionOption {
      id: string
      tenantId: string
      positionCode: string
      positionName: string
      organizationId?: string | null
      jobProfileId: string
      jobProfile?: Pick<JobProfile, 'id' | 'jobCode' | 'jobName'> | null
      gradeId?: string | null
      grade?: Pick<Grade, 'id' | 'gradeCode' | 'gradeName'> | null
      headcountLimit: number
      multipleIncumbentsAllowed: boolean
      enabled: boolean
    }

    interface JobFamily {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      familyCode: string
      familyName: string
      enabled: boolean
      sort: number
      description?: string | null
      jobProfileCount?: number
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    interface Grade {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      gradeCode: string
      gradeName: string
      gradeLevel: number
      enabled: boolean
      sort: number
      description?: string | null
      jobProfileCount?: number
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    interface JobProfile {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      familyId: string
      family?: Pick<JobFamily, 'id' | 'familyCode' | 'familyName'> | null
      defaultGradeId?: string | null
      defaultGrade?: Pick<Grade, 'id' | 'gradeCode' | 'gradeName'> | null
      jobCode: string
      jobName: string
      enabled: boolean
      sort: number
      responsibilities?: string | null
      requirements?: string | null
      description?: string | null
      positionCount?: number
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    interface JobArchitectureSearchParams extends Api.Common.CommonSearchParams {
      tenantId?: string
      keyword?: string
      enabled?: boolean
    }

    interface JobArchitectureOption {
      id: string
      code: string
      name: string
      level?: number
      familyId?: string
      defaultGradeId?: string | null
    }

    type CompensationEntity = 'employee' | 'plan' | 'component' | 'band'
    type CompensationComponentCategory = 'earning' | 'deduction' | 'employer_cost'
    type CompensationAmountType = 'fixed' | 'rate' | 'variable'
    type PayFrequency = 'monthly' | 'annual' | 'hourly'
    type CompensationLifecycleStatus = 'draft' | 'scheduled' | 'active' | 'expired' | 'cancelled'
    type CompensationRangeStatus = 'within' | 'below' | 'above' | 'unconfigured'

    interface CompensationReference {
      id: string
      code?: string
      name?: string
      employeeNo?: string
      employeeName?: string
      organizationId?: string | null
      organizationName?: string | null
      gradeId?: string | null
      gradeName?: string | null
      currencyCode?: string
      payFrequency?: PayFrequency
      category?: CompensationComponentCategory
      amountType?: CompensationAmountType
      level?: number
    }

    interface PayComponent {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      componentCode: string
      componentName: string
      category: CompensationComponentCategory
      amountType: CompensationAmountType
      taxable: boolean
      enabled: boolean
      sort: number
      description?: string | null
      planCount?: number
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    interface CompensationPlanItem {
      id?: string
      componentId: string
      componentCode?: string
      componentName?: string
      category?: CompensationComponentCategory
      amountType?: CompensationAmountType
      defaultAmount?: ProtectedAmount
      defaultRate?: ProtectedAmount
      required: boolean
      sort: number
    }

    interface CompensationPlan {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      planCode: string
      planName: string
      currencyCode: string
      payFrequency: PayFrequency
      enabled: boolean
      sort: number
      description?: string | null
      componentCount?: number
      employeeCount?: number
      items: CompensationPlanItem[]
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    interface SalaryBand {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      gradeId: string
      grade?: Pick<Grade, 'id' | 'gradeCode' | 'gradeName' | 'gradeLevel'> | null
      currencyCode: string
      minimumAmount: ProtectedAmount
      midpointAmount: ProtectedAmount
      maximumAmount: ProtectedAmount
      effectiveFrom: string
      effectiveTo?: string | null
      status?: 'draft' | 'approved' | 'cancelled'
      lifecycleStatus?: CompensationLifecycleStatus
      description?: string | null
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    interface EmployeeCompensationItem {
      id?: string
      componentId: string
      componentCode?: string
      componentName?: string
      category?: CompensationComponentCategory
      amountType?: CompensationAmountType
      amount?: ProtectedAmount
      rate?: ProtectedAmount
      source?: 'plan' | 'override'
    }

    interface EmployeeCompensation {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      employeeId: string
      employee?: Pick<Employee, 'id' | 'employeeNo' | 'employeeName'> | null
      organization?: Pick<
        SystemManage.OrganizationListItem,
        'id' | 'organizationCode' | 'organizationName'
      > | null
      planId: string
      plan?: Pick<CompensationPlan, 'id' | 'planCode' | 'planName'> | null
      gradeId?: string | null
      grade?: Pick<Grade, 'id' | 'gradeCode' | 'gradeName' | 'gradeLevel'> | null
      baseAmount: ProtectedAmount
      currencyCode: string
      payFrequency: PayFrequency
      effectiveFrom: string
      effectiveTo?: string | null
      status?: 'draft' | 'approved' | 'cancelled'
      lifecycleStatus?: CompensationLifecycleStatus
      rangeStatus?: CompensationRangeStatus
      bandMinimum?: ProtectedAmount
      bandMaximum?: ProtectedAmount
      changeReason: string
      sourceChangeId?: string | null
      approvedBy?: string | null
      approvedAt?: string | null
      items: EmployeeCompensationItem[]
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    type CompensationRecord = EmployeeCompensation | CompensationPlan | PayComponent | SalaryBand

    interface CompensationSearchParams extends Api.Common.CommonSearchParams {
      tenantId?: string
      keyword?: string
      status?: string
    }

    interface CompensationOverview {
      employeeCount: number
      coveredCount: number
      coverageRate: number
      scheduledCount: number
      enabledPlanCount: number
      enabledComponentCount: number
    }

    interface CompensationListResult<TRecord extends CompensationRecord = CompensationRecord> {
      records: TRecord[]
      total: number
      amountAccess: boolean
    }

    type CompensationReviewEntity = 'cycle' | 'item' | 'budget'
    type CompensationReviewCycleStatus =
      'draft' | 'open' | 'calibrating' | 'approved' | 'effected' | 'cancelled'
    type CompensationReviewItemStatus =
      'pending' | 'recommended' | 'calibrated' | 'approved' | 'effected' | 'excluded'
    type CompensationReviewCycleAction = 'open' | 'calibrate' | 'approve' | 'effect' | 'cancel'

    interface CompensationReviewCycle {
      id?: string
      tenantId?: string
      cycleCode: string
      cycleName: string
      reviewYear: number
      effectiveDate: string
      recommendationDueDate: string
      calibrationDueDate: string
      scopeOrganizationId?: string | null
      scopeOrganizationName?: string | null
      currencyCode: string
      defaultBudgetPercent: number
      guidelineMinPercent: number
      guidelineMaxPercent: number
      status: CompensationReviewCycleStatus
      description?: string | null
      decisionNote?: string | null
      employeeCount?: number
      pendingCount?: number
      budgetAmount?: ProtectedAmount
      proposedIncreaseAmount?: ProtectedAmount
      createTime?: string
      updateTime?: string
    }

    interface CompensationReviewItem {
      id?: string
      tenantId?: string
      cycleId: string
      cycleName?: string
      cycleStatus?: CompensationReviewCycleStatus
      employeeId: string
      employeeNo?: string
      employeeName?: string
      organizationId?: string | null
      organizationName?: string | null
      currentCompensationId: string
      currentGradeId?: string | null
      gradeName?: string | null
      currentBaseAmount: ProtectedAmount
      proposedBaseAmount: ProtectedAmount
      increaseAmount?: ProtectedAmount
      increasePercent?: number | null
      performanceLevel?: string | null
      status: CompensationReviewItemStatus
      recommendationReason?: string | null
      recommendedBy?: string | null
      recommendedAt?: string | null
      calibrationNote?: string | null
      calibratedBy?: string | null
      calibratedAt?: string | null
      exclusionReason?: string | null
      newCompensationId?: string | null
      outOfGuideline?: boolean
      exclude?: boolean
      createTime?: string
      updateTime?: string
    }

    interface CompensationReviewBudget {
      id?: string
      tenantId?: string
      cycleId: string
      cycleName?: string
      organizationId?: string | null
      organizationName?: string | null
      budgetAmount: ProtectedAmount
      usedAmount?: ProtectedAmount
      remainingAmount?: ProtectedAmount
      utilizationPercent?: number | null
      employeeCount?: number
      source?: 'auto' | 'manual'
      note?: string | null
      cycleStatus?: CompensationReviewCycleStatus
      createTime?: string
      updateTime?: string
    }

    type CompensationReviewRecord =
      CompensationReviewCycle | CompensationReviewItem | CompensationReviewBudget

    interface CompensationReviewSearchParams extends Api.Common.CommonSearchParams {
      tenantId?: string
      cycleId?: string
      keyword?: string
      status?: string
    }

    interface CompensationReviewReference {
      id: string
      tenantId?: string
      code?: string
      name?: string
      status?: CompensationReviewCycleStatus
      effectiveDate?: string
    }

    interface CompensationReviewOverview {
      cycleCount: number
      amountAccess: boolean
      selectedCycle: CompensationReviewCycle | null
      eligibleCount: number
      pendingCount: number
      recommendedCount: number
      calibratedCount: number
      approvedCount: number
      effectedCount: number
      excludedCount: number
      outOfGuidelineCount: number
      budgetAmount: number | null
      proposedIncreaseAmount: number | null
      budgetUtilization: number | null
    }

    interface CompensationReviewListResult<
      TRecord extends CompensationReviewRecord = CompensationReviewRecord
    > {
      records: TRecord[]
      total: number
      amountAccess: boolean
    }

    type ContingentWorkforceEntity = 'engagement' | 'worker' | 'vendor' | 'control'
    type ExternalVendorStatus = 'draft' | 'active' | 'suspended' | 'expired' | 'inactive'
    type ExternalWorkerStatus = 'candidate' | 'ready' | 'active' | 'inactive' | 'blocked'
    type ExternalEngagementStatus =
      'draft' | 'pending_review' | 'active' | 'offboarding' | 'ended' | 'cancelled'
    type ExternalControlStatus = 'pending' | 'completed' | 'waived' | 'failed'
    type ExternalWorkerType = 'outsourced' | 'dispatch' | 'contractor' | 'consultant' | 'temporary'
    type ContingentTransitionKind = 'vendor' | 'worker' | 'engagement'

    interface ContingentWorkforceReference {
      id: string
      tenantId?: string
      code?: string
      name: string
      status?: string
      extra?: string | null
      vendorId?: string | null
      organizationId?: string | null
    }

    interface ExternalVendor {
      id?: string
      tenantId?: string
      vendorCode: string
      vendorName: string
      registrationNo?: string | null
      contactName?: string | null
      contactPhone?: string | null
      contactEmail?: string | null
      serviceScope?: string | null
      contractNo?: string | null
      contractStartDate?: string | null
      contractEndDate?: string | null
      complianceStatus: 'pending' | 'verified' | 'rejected' | 'expired'
      riskLevel: 'low' | 'medium' | 'high'
      status: ExternalVendorStatus
      note?: string | null
      activeEngagementCount?: number
      workerCount?: number
      createTime?: string
      updateTime?: string
    }

    interface ExternalWorker {
      id?: string
      tenantId?: string
      workerNo: string
      workerName: string
      workerType: ExternalWorkerType
      vendorId?: string | null
      vendorName?: string | null
      vendorWorkerNo?: string | null
      phone?: string | null
      email?: string | null
      identityCheckStatus: 'pending' | 'passed' | 'failed' | 'expired'
      status: ExternalWorkerStatus
      note?: string | null
      activeEngagementCount?: number
      nextEndDate?: string | null
      createTime?: string
      updateTime?: string
    }

    interface ExternalEngagement {
      id?: string
      tenantId?: string
      engagementNo: string
      workerId: string
      workerNo?: string
      workerName?: string
      workerType?: ExternalWorkerType
      vendorId?: string | null
      vendorName?: string | null
      organizationId: string
      organizationName?: string
      positionId?: string | null
      positionName?: string | null
      sponsorEmployeeId: string
      sponsorEmployeeName?: string
      serviceTitle: string
      workLocation?: string | null
      startDate: string
      endDate: string
      accessExpiryDate: string
      actualExitDate?: string | null
      fte: number
      billingRate?: ProtectedAmount | null
      billingUnit?: 'hour' | 'day' | 'month' | 'fixed' | null
      currencyCode?: string | null
      complianceStatus: 'pending' | 'cleared' | 'blocked' | 'expired'
      status: ExternalEngagementStatus
      activationNote?: string | null
      endReason?: string | null
      version: number
      pendingControlCount?: number
      controlCount?: number
      createTime?: string
      updateTime?: string
    }

    interface ExternalEngagementControl {
      id?: string
      tenantId?: string
      engagementId: string
      engagementNo?: string
      engagementStatus?: ExternalEngagementStatus
      workerName?: string
      controlType:
        | 'identity'
        | 'contract'
        | 'nda'
        | 'insurance'
        | 'safety_training'
        | 'access_badge'
        | 'system_account'
        | 'equipment'
        | 'other'
      controlName: string
      required: boolean
      status: ExternalControlStatus
      dueDate?: string | null
      completedAt?: string | null
      completedBy?: string | null
      evidenceReference?: string | null
      note?: string | null
      createTime?: string
      updateTime?: string
    }

    type ContingentWorkforceRecord =
      ExternalVendor | ExternalWorker | ExternalEngagement | ExternalEngagementControl

    interface ContingentWorkforceSearchParams extends Api.Common.CommonSearchParams {
      tenantId?: string
      engagementId?: string
      keyword?: string
      status?: string
      from?: number
      to?: number
    }

    interface ContingentWorkforceOverview {
      piiAccess: boolean
      costAccess: boolean
      activeVendorCount: number
      activeWorkerCount: number
      activeEngagementCount: number
      pendingReviewCount: number
      pendingControlCount: number
      endingSoonCount: number
      accessExpiringCount: number
      blockedCount: number
    }

    interface ContingentWorkforceListResult<
      TRecord extends ContingentWorkforceRecord = ContingentWorkforceRecord
    > {
      records: TRecord[]
      total: number
      piiAccess: boolean
      costAccess: boolean
    }

    type PolicyAcknowledgementEntity = 'policy' | 'receipt'
    type HrPolicyStatus = 'draft' | 'published' | 'retired' | 'cancelled'
    type HrPolicyReceiptStatus = 'pending' | 'overdue' | 'acknowledged' | 'waived'

    interface HrPolicyDocument {
      id?: string
      tenantId?: string
      policyCode: string
      policyTitle: string
      category: string
      versionNo: number
      effectiveDate: string
      acknowledgementDueDays: number
      audienceType: 'all' | 'organization' | 'employment_type'
      audienceOrganizationId?: string | null
      audienceOrganizationName?: string | null
      audienceEmploymentType?: string | null
      documentReference: string
      contentSummary: string
      status: HrPolicyStatus
      supersedesPolicyId?: string | null
      supersedesPolicyTitle?: string | null
      publishedAt?: string | null
      publishedBy?: string | null
      decisionNote?: string | null
      receiptCount?: number
      acknowledgedCount?: number
      waivedCount?: number
      overdueCount?: number
      createTime?: string
      updateTime?: string
    }

    interface HrPolicyReceipt {
      id?: string
      tenantId?: string
      policyId: string
      policyCode?: string
      policyTitle?: string
      policyVersionNo?: number
      policyStatus?: HrPolicyStatus
      documentReference?: string
      employeeId: string
      employeeNo?: string
      employeeName?: string
      organizationName?: string | null
      jobTitle?: string | null
      deliveredAt?: string
      dueDate: string
      status: HrPolicyReceiptStatus
      storedStatus?: Exclude<HrPolicyReceiptStatus, 'overdue'>
      acknowledgedAt?: string | null
      acknowledgedBy?: string | null
      acknowledgementNote?: string | null
      evidenceReference?: string | null
      waivedAt?: string | null
      waivedBy?: string | null
      waiverReason?: string | null
      createTime?: string
      updateTime?: string
    }

    type PolicyAcknowledgementRecord = HrPolicyDocument | HrPolicyReceipt

    interface PolicyAcknowledgementReference {
      id: string
      tenantId?: string
      code?: string
      name: string
      status?: string
      effectiveDate?: string
    }

    interface PolicyAcknowledgementSearchParams extends Api.Common.CommonSearchParams {
      tenantId?: string
      policyId?: string
      keyword?: string
      status?: string
      from?: number
      to?: number
    }

    interface PolicyAcknowledgementOverview {
      draftPolicyCount: number
      publishedPolicyCount: number
      scheduledPolicyCount: number
      receiptCount: number
      acknowledgedCount: number
      pendingCount: number
      overdueCount: number
      completionRate: number
      evidenceAccess: boolean
    }

    interface PolicyAcknowledgementListResult<
      TRecord extends PolicyAcknowledgementRecord = PolicyAcknowledgementRecord
    > {
      records: TRecord[]
      total: number
      evidenceAccess: boolean
    }

    type OrganizationDesignEntity = 'scenario' | 'change'
    type OrganizationDesignStatus =
      'draft' | 'impact_review' | 'approved' | 'rejected' | 'handed_off' | 'cancelled'
    type OrganizationDesignRisk = 'unassessed' | 'low' | 'medium' | 'high' | 'critical'
    type OrganizationChangeType = 'create' | 'rename' | 'reparent' | 'inactivate'

    interface OrganizationDesignScenario {
      id?: string
      tenantId?: string
      scenarioCode: string
      scenarioName: string
      objective: string
      effectiveDate: string
      ownerEmployeeId?: string | null
      ownerEmployeeName?: string | null
      ownerEmployeeNo?: string | null
      status: OrganizationDesignStatus
      riskLevel: OrganizationDesignRisk
      submissionNote?: string | null
      decisionNote?: string | null
      baselineCapturedAt?: string | null
      submittedAt?: string | null
      submittedBy?: string | null
      decidedAt?: string | null
      decidedBy?: string | null
      handedOffAt?: string | null
      handedOffBy?: string | null
      version: number
      changeCount?: number
      impactedEmployeeCount?: number
      impactedPositionCount?: number
      impactedSecurityUserCount?: number
      impactedScopeCount?: number
      createTime?: string
      updateTime?: string
    }

    interface OrganizationDesignChange {
      id?: string
      tenantId?: string
      scenarioId: string
      scenarioCode?: string
      scenarioName?: string
      scenarioStatus?: OrganizationDesignStatus
      changeType: OrganizationChangeType
      organizationId?: string | null
      currentParentId?: string | null
      currentCode?: string | null
      currentName?: string | null
      currentType?: string | null
      proposedParentId?: string | null
      proposedParentName?: string | null
      proposedCode?: string | null
      proposedName?: string | null
      proposedType?: string | null
      proposedStatus?: string | null
      rationale: string
      sequence: number
      impactedEmployeeCount?: number
      impactedPositionCount?: number
      impactedRequisitionCount?: number
      impactedSecurityUserCount?: number
      impactedScopeCount?: number
      impactCapturedAt?: string | null
      createTime?: string
      updateTime?: string
    }

    type OrganizationDesignRecord = OrganizationDesignScenario | OrganizationDesignChange

    interface OrganizationDesignReference {
      id: string
      tenantId?: string
      code?: string
      name: string
      parentId?: string | null
      organizationId?: string | null
      organizationType?: string
      status?: string
      effectiveDate?: string
    }

    interface OrganizationDesignSearchParams extends Api.Common.CommonSearchParams {
      tenantId?: string
      scenarioId?: string
      keyword?: string
      status?: string
      from?: number
      to?: number
    }

    interface OrganizationDesignOverview {
      draftCount: number
      reviewCount: number
      approvedCount: number
      handoffCount: number
      highRiskCount: number
      changeCount: number
      impactedEmployeeCount: number
      impactedSecurityUserCount: number
    }

    interface OrganizationDesignListResult<
      TRecord extends OrganizationDesignRecord = OrganizationDesignRecord
    > {
      records: TRecord[]
      total: number
    }

    type InternalMobilityEntity = 'opportunity' | 'application'
    type InternalOpportunityType = 'permanent' | 'rotation' | 'project' | 'gig'
    type InternalOpportunityStatus = 'draft' | 'open' | 'paused' | 'closed' | 'cancelled'
    type InternalMobilityApplicationStatus =
      | 'draft'
      | 'submitted'
      | 'under_review'
      | 'shortlisted'
      | 'offered'
      | 'accepted'
      | 'rejected'
      | 'withdrawn'
      | 'converted'
    type InternalMobilityWorkMode = 'onsite' | 'hybrid' | 'remote'
    type InternalMobilityManagerAwareness = 'not_informed' | 'informed' | 'supported'

    interface InternalMobilityOpportunity {
      id?: string
      tenantId?: string
      opportunityCode: string
      opportunityTitle: string
      opportunityType: InternalOpportunityType
      organizationId: string
      organizationName?: string
      positionId?: string | null
      positionName?: string | null
      hiringManagerEmployeeId: string
      hiringManagerName?: string
      capacity: number
      workLocation?: string | null
      workMode: InternalMobilityWorkMode
      expectedStartDate: string
      expectedEndDate?: string | null
      applicationOpenDate: string
      applicationCloseDate: string
      minTenureMonths: number
      roleSummary: string
      requiredSkills: string
      eligibilityNotes?: string | null
      status: InternalOpportunityStatus
      publishedAt?: string | null
      publishedBy?: string | null
      decisionNote?: string | null
      version: number
      applicationCount?: number
      shortlistedCount?: number
      acceptedCount?: number
      myApplicationId?: string | null
      myApplicationStatus?: InternalMobilityApplicationStatus | null
      createTime?: string
      updateTime?: string
    }

    interface InternalMobilityApplication {
      id?: string
      tenantId?: string
      opportunityId: string
      opportunityCode?: string
      opportunityTitle?: string
      opportunityType?: InternalOpportunityType
      opportunityStatus?: InternalOpportunityStatus
      targetOrganizationName?: string
      targetPositionName?: string | null
      employeeId?: string
      employeeNo?: string
      employeeName?: string
      currentOrganizationId?: string
      currentOrganizationName?: string
      currentPositionId?: string | null
      currentPositionName?: string | null
      currentJobTitle?: string | null
      motivation: string
      relevantExperience?: string | null
      preferredStartDate?: string | null
      managerAwareness: InternalMobilityManagerAwareness
      status: InternalMobilityApplicationStatus
      submittedAt?: string | null
      reviewedAt?: string | null
      reviewedBy?: string | null
      assessmentScore?: number | null
      assessmentNote?: string | null
      decisionAt?: string | null
      decisionBy?: string | null
      decisionNote?: string | null
      acceptedAt?: string | null
      acceptedBy?: string | null
      personnelChangeId?: string | null
      createTime?: string
      updateTime?: string
    }

    type InternalMobilityRecord = InternalMobilityOpportunity | InternalMobilityApplication

    interface InternalMobilityReference {
      id: string
      tenantId?: string
      code?: string
      name: string
      organizationId?: string | null
      status?: string
    }

    interface InternalMobilitySearchParams extends Api.Common.CommonSearchParams {
      tenantId?: string
      opportunityId?: string
      keyword?: string
      status?: string
      from?: number
      to?: number
    }

    interface InternalMobilityOverview {
      openOpportunityCount: number
      closingSoonCount: number
      applicationCount: number
      activeApplicationCount: number
      offerCount: number
      convertedCount: number
      myEmployeeId?: string | null
      manageAccess: boolean
    }

    interface InternalMobilityListResult<
      TRecord extends InternalMobilityRecord = InternalMobilityRecord
    > {
      records: TRecord[]
      total: number
      manageAccess: boolean
      myEmployeeId?: string | null
    }

    type AbsenceEntity = 'request' | 'balance' | 'policy' | 'type' | 'ledger'
    type LeaveUnit = 'day' | 'hour'
    type LeavePolicyScope = 'all' | 'organization' | 'employee' | 'grade'
    type LeaveEntitlementMethod = 'annual' | 'monthly_accrual' | 'manual' | 'none'
    type LeavePolicyStatus = 'draft' | 'active' | 'inactive'
    type LeaveRequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled'

    interface AbsenceReference {
      id: string
      tenantId?: string
      code?: string
      name?: string
      unit?: LeaveUnit
      minimumIncrement?: number
      leaveTypeId?: string
      organizationId?: string | null
      organizationName?: string | null
    }

    interface LeaveType {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      leaveCode: string
      leaveName: string
      category: string
      unit: LeaveUnit
      paidRatio: number
      minimumIncrement: number
      proofRequiredAfter?: number | null
      color: string
      enabled: boolean
      sort: number
      description?: string | null
      policyCount?: number
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    interface LeavePolicyScopeReference {
      organizationId?: string | null
      organizationCode?: string | null
      organizationName?: string | null
      employeeId?: string | null
      employeeNo?: string | null
      employeeName?: string | null
      gradeId?: string | null
      gradeCode?: string | null
      gradeName?: string | null
    }

    interface LeavePolicy {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      leaveTypeId: string
      leaveType?: Pick<LeaveType, 'id' | 'leaveCode' | 'leaveName' | 'unit'> | null
      policyCode: string
      policyName: string
      scopeType: LeavePolicyScope
      organizationId?: string | null
      employeeId?: string | null
      gradeId?: string | null
      scope?: LeavePolicyScopeReference | null
      entitlementMethod: LeaveEntitlementMethod
      annualQuota: number
      monthlyAccrual: number
      carryoverLimit: number
      carryoverExpiryMonths?: number | null
      allowNegative: boolean
      negativeLimit: number
      probationEligible: boolean
      effectiveFrom: string
      effectiveTo?: string | null
      status: LeavePolicyStatus
      description?: string | null
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    interface LeaveBalance {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      employeeId: string
      employee?: Pick<Employee, 'id' | 'employeeNo' | 'employeeName'> | null
      organization?: Pick<SystemManage.OrganizationListItem, 'organizationName'> | null
      leaveTypeId: string
      leaveType?: Pick<LeaveType, 'id' | 'leaveCode' | 'leaveName' | 'unit'> | null
      policyId?: string | null
      policy?: Pick<LeavePolicy, 'id' | 'policyCode' | 'policyName'> | null
      balanceYear: number
      openingAmount: number
      accruedAmount: number
      adjustedAmount: number
      pendingAmount: number
      usedAmount: number
      expiredAmount: number
      availableAmount: number
      expiresOn?: string | null
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    interface LeaveRequest {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      requestNo?: string
      employeeId: string
      employee?: Pick<Employee, 'id' | 'employeeNo' | 'employeeName'> | null
      organization?: Pick<SystemManage.OrganizationListItem, 'organizationName'> | null
      leaveTypeId: string
      leaveType?: Pick<LeaveType, 'id' | 'leaveCode' | 'leaveName' | 'unit'> | null
      policyId?: string | null
      balanceId?: string | null
      startDate: string
      endDate: string
      startSession: 'full' | 'morning' | 'afternoon'
      endSession: 'full' | 'morning' | 'afternoon'
      requestedAmount: number
      unitSnapshot?: LeaveUnit
      reason: string
      proofUrls: string[]
      status?: LeaveRequestStatus
      workflowInstanceId?: string | null
      submittedAt?: string | null
      reviewedAt?: string | null
      reviewedBy?: string | null
      reviewComment?: string | null
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    interface LeaveLedger {
      id: string
      tenantId: string
      balanceId: string
      employeeId: string
      employee?: Pick<Employee, 'id' | 'employeeNo' | 'employeeName'> | null
      leaveTypeId: string
      leaveType?: Pick<LeaveType, 'id' | 'leaveCode' | 'leaveName' | 'unit'> | null
      requestId?: string | null
      request?: Pick<LeaveRequest, 'id' | 'requestNo'> | null
      transactionType: string
      deltaOpening: number
      deltaAccrued: number
      deltaAdjusted: number
      deltaPending: number
      deltaUsed: number
      deltaExpired: number
      occurredOn: string
      reason: string
      createBy?: string
      createTime?: string
    }

    type AbsenceRecord = LeaveRequest | LeaveBalance | LeavePolicy | LeaveType | LeaveLedger

    interface AbsenceSearchParams extends Api.Common.CommonSearchParams {
      tenantId?: string
      keyword?: string
      status?: string
      balanceYear?: number
    }

    interface AbsenceOverview {
      pendingCount: number
      upcomingCount: number
      coveredEmployeeCount: number
      activePolicyCount: number
      expiringBalanceCount: number
    }

    interface AbsenceListResult<TRecord extends AbsenceRecord = AbsenceRecord> {
      records: TRecord[]
      total: number
      reasonAccess: boolean
    }

    interface AssignmentSnapshot {
      assignmentId?: string | null
      assignmentUpdatedAt?: string | null
      organizationId?: string | null
      organizationCode?: string | null
      organizationName?: string | null
      positionId?: string | null
      positionCode?: string | null
      positionName?: string | null
      jobProfileId?: string | null
      jobCode?: string | null
      jobName?: string | null
      gradeId?: string | null
      gradeCode?: string | null
      gradeName?: string | null
      businessTitle?: string | null
      assignmentStatus?: string | null
      employmentStatus?: EmploymentStatus | null
      effectiveStart?: string | null
      fte?: number | null
    }

    interface PersonnelChangeEmployeeOption {
      id: string
      tenantId: string
      employeeNo: string
      employeeName: string
      avatarUrl?: string | null
      jobTitle?: string | null
      employmentStatus: EmploymentStatus
      assignmentId: string
      assignmentUpdatedAt: string
      assignmentSnapshot: AssignmentSnapshot
    }

    interface OrganizationPositionEmployee {
      id: string
      organizationId?: string | null
      positionId: string
      employeeNo: string
      employeeName: string
      avatarUrl?: string | null
      jobTitle?: string | null
      employmentStatus: EmploymentStatus
      employmentType: EmploymentType
      hireDate?: string | null
    }

    interface OrganizationPositionDirectory {
      positions: Position[]
      employees: OrganizationPositionEmployee[]
      employeeTotal: number
      truncated: boolean
    }

    interface EmployeeAccount {
      id: string
      userEmail: string
      status: string
    }

    interface Employee {
      id?: string
      tenantId?: string
      tenant?: Pick<SystemManage.TenantListItem, 'id' | 'tenantCode' | 'tenantName'> | null
      organizationId?: string | null
      organization?: Pick<
        SystemManage.OrganizationListItem,
        'id' | 'organizationCode' | 'organizationName'
      > | null
      positionId?: string | null
      employeeNo: string
      employeeName: string
      avatarUrl?: string | null
      jobTitle?: string | null
      employmentStatus: EmploymentStatus
      employmentType: EmploymentType
      gender?: string | null
      birthDate?: string | null
      phone?: string | null
      email?: string | null
      idCardNo?: string | null
      ethnicity?: string | null
      educationLevel?: string | null
      schoolName?: string | null
      majorName?: string | null
      maritalStatus?: string | null
      politicalStatus?: string | null
      nativePlace?: string | null
      homeAddress?: string | null
      hireDate?: string | null
      probationEndDate?: string | null
      leaveDate?: string | null
      contractStartDate?: string | null
      contractEndDate?: string | null
      emergencyContactName?: string | null
      emergencyContactRelation?: string | null
      emergencyContactPhone?: string | null
      remark?: string | null
      account?: EmployeeAccount | null
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
      fieldAccess?: EmployeeFieldAccessMap
      isRecordOwner?: boolean
    }

    type EmployeeSearchParams = Partial<
      Pick<Employee, 'tenantId' | 'organizationId' | 'employmentStatus' | 'employmentType'> &
        Api.Common.CommonSearchParams & {
          keyword?: string
          hireDateRange?: string[]
          recordId?: string
          organizationIds?: string[]
          organizationUnassigned?: boolean
        }
    >

    interface EmployeeContract {
      id?: string
      tenantId?: string
      employeeId?: string
      contractNo: string
      contractType: string
      contractStatus: string
      signDate?: string | null
      startDate: string
      endDate?: string | null
      probationEndDate?: string | null
      workLocation?: string | null
      monthlySalary?: ProtectedAmount
      attachmentUrl?: string | null
      renewalReminderDays?: number
      previousContractId?: string | null
      renewalOwnerId?: string | null
      renewalDecision?: ComplianceRenewalDecision
      renewalStartedAt?: string | null
      renewedAt?: string | null
      terminationDate?: string | null
      terminationReason?: string | null
      remark?: string | null
    }

    interface EmployeeEducation {
      id?: string
      tenantId?: string
      employeeId?: string
      schoolName: string
      majorName?: string | null
      educationLevel: string
      degree?: string | null
      startDate?: string | null
      endDate?: string | null
      fullTime: boolean
      certificateNo?: string | null
      remark?: string | null
    }

    interface EmployeeWorkExperience {
      id?: string
      tenantId?: string
      employeeId?: string
      companyName: string
      departmentName?: string | null
      jobTitle: string
      startDate: string
      endDate?: string | null
      responsibilities?: string | null
      leavingReason?: string | null
      referenceName?: string | null
      referencePhone?: string | null
    }

    interface EmployeeTraining {
      id?: string
      tenantId?: string
      employeeId?: string
      trainingName: string
      trainingType: string
      providerName?: string | null
      startDate: string
      endDate?: string | null
      trainingResult?: string | null
      certificateName?: string | null
      certificateNo?: string | null
      cost?: ProtectedAmount
      remark?: string | null
    }

    interface EmployeeReward {
      id?: string
      tenantId?: string
      employeeId?: string
      recordType: string
      recordLevel?: string | null
      title: string
      recordDate: string
      issuingOrganization?: string | null
      amount?: ProtectedAmount
      description?: string | null
    }

    interface EmployeeProfile extends Employee {
      contracts: EmployeeContract[]
      educations: EmployeeEducation[]
      workExperiences: EmployeeWorkExperience[]
      trainings: EmployeeTraining[]
      rewards: EmployeeReward[]
      historyCounts?: Partial<
        Record<'contracts' | 'educations' | 'workExperiences' | 'trainings' | 'rewards', number>
      >
      historiesMasked?: boolean
    }

    interface EmployeeProfilePayload {
      employee: Employee
      contracts?: EmployeeContract[]
      educations?: EmployeeEducation[]
      workExperiences?: EmployeeWorkExperience[]
      trainings?: EmployeeTraining[]
      rewards?: EmployeeReward[]
    }

    interface EmployeeSelectorItem {
      id: string
      tenantId: string
      organizationId?: string | null
      employeeNo: string
      employeeName: string
      avatarUrl?: string | null
      jobTitle?: string | null
      employmentStatus: EmploymentStatus
      gender?: string | null
      phone?: string | null
      email?: string | null
      organization?: Pick<
        SystemManage.OrganizationListItem,
        'id' | 'organizationCode' | 'organizationName'
      > | null
    }

    type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'effective' | 'rejected' | 'cancelled'
    type WorkspaceEntity =
      | 'contract'
      | 'personnelChange'
      | 'qualification'
      | 'headcount'
      | 'trainingPlan'
      | 'trainingEnrollment'
      | 'competency'
      | 'positionCompetency'
      | 'employeeCompetency'
      | 'recruitmentRequisition'
      | 'candidate'

    interface WorkspaceReference {
      id: string
      employeeNo?: string
      employeeName?: string
      positionCode?: string
      positionName?: string
      jobCode?: string
      jobName?: string
      gradeCode?: string
      gradeName?: string
      organizationCode?: string
      organizationName?: string
      shiftCode?: string
      shiftName?: string
      cycleCode?: string
      cycleName?: string
      planCode?: string
      planName?: string
      competencyCode?: string
      competencyName?: string
      requisitionNo?: string
    }

    interface WorkspaceRecord {
      id?: string
      tenantId?: string
      employeeId?: string | null
      employee?: WorkspaceReference | null
      organizationId?: string | null
      organization?: WorkspaceReference | null
      fromOrganization?: WorkspaceReference | null
      toOrganization?: WorkspaceReference | null
      positionId?: string | null
      position?: WorkspaceReference | null
      fromPosition?: WorkspaceReference | null
      toPosition?: WorkspaceReference | null
      contractNo?: string
      contractType?: string
      contractStatus?: string
      signDate?: string | null
      probationEndDate?: string | null
      workLocation?: string | null
      monthlySalary?: ProtectedAmount
      renewalReminderDays?: number
      changeNo?: string
      changeType?: string
      effectiveDate?: string
      status?: string
      fromOrganizationId?: string | null
      toOrganizationId?: string | null
      fromPositionId?: string | null
      toPositionId?: string | null
      fromEmploymentStatus?: string | null
      toEmploymentStatus?: string | null
      fromJobTitle?: string | null
      toJobTitle?: string | null
      fromJobProfileId?: string | null
      toJobProfileId?: string | null
      fromGradeId?: string | null
      toGradeId?: string | null
      fromBusinessTitle?: string | null
      toBusinessTitle?: string | null
      baseAssignmentId?: string | null
      baseAssignmentUpdatedAt?: string | null
      beforeAssignmentSnapshot?: AssignmentSnapshot
      afterAssignmentSnapshot?: AssignmentSnapshot
      reason?: string | null
      caseNo?: string
      caseType?: string
      plannedEffectiveDate?: string
      ownerUserId?: string | null
      lifecycleCaseId?: string | null
      lifecycleCase?: WorkspaceReference | null
      taskType?: string
      taskName?: string
      responsibleUserId?: string | null
      dueDate?: string | null
      completionNote?: string | null
      sort?: number
      qualificationType?: string
      qualificationName?: string
      certificateNo?: string | null
      issuer?: string | null
      issueDate?: string | null
      expiryDate?: string | null
      attachmentUrl?: string | null
      reminderDays?: number
      approvedCount?: number
      occupiedCount?: number
      vacancyCount?: number
      effectiveFrom?: string
      effectiveTo?: string | null
      enabled?: boolean
      shiftCode?: string
      shiftName?: string
      shiftType?: string
      startTime?: string
      endTime?: string
      breakMinutes?: number
      crossDay?: boolean
      shiftId?: string | null
      shift?: WorkspaceReference | null
      workDate?: string
      assignmentStatus?: string
      clockInAt?: string | null
      clockOutAt?: string | null
      workMinutes?: number
      overtimeMinutes?: number
      attendanceStatus?: string
      source?: string
      requestNo?: string
      requestType?: string
      title?: string
      startAt?: string | null
      endAt?: string | null
      durationHours?: number | null
      requestData?: Record<string, unknown>
      cycleCode?: string
      cycleName?: string
      startDate?: string
      endDate?: string | null
      description?: string | null
      cycleId?: string | null
      cycle?: WorkspaceReference | null
      reviewerUserId?: string | null
      totalScore?: number | null
      performanceLevel?: string | null
      employeeSummary?: string | null
      reviewerComment?: string | null
      reviewId?: string | null
      review?: WorkspaceReference | null
      goalName?: string
      targetDescription?: string
      weight?: number
      actualResult?: string | null
      evidenceSource?: string | null
      planCode?: string
      planName?: string
      trainingType?: string
      providerName?: string | null
      budget?: number | null
      objective?: string | null
      planId?: string | null
      plan?: WorkspaceReference | null
      score?: number | null
      result?: string | null
      competencyCode?: string
      competencyName?: string
      category?: string
      competencyId?: string | null
      competency?: WorkspaceReference | null
      currentLevel?: string
      requiredLevel?: string
      assessedDate?: string
      evidence?: string | null
      requisitionNo?: string
      openingCount?: number
      hiredCount?: number
      expectedOnboardDate?: string | null
      employmentType?: EmploymentType
      requirements?: string | null
      requisitionId?: string | null
      requisition?: WorkspaceReference | null
      candidateName?: string
      phone?: string | null
      email?: string | null
      stage?: string
      expectedSalary?: number | null
      resumeUrl?: string | null
      interviewFeedback?: string | null
      offerDate?: string | null
      onboardEmployeeId?: string | null
      remark?: string | null
      createBy?: string | null
      createTime?: string
      updateBy?: string | null
      updateTime?: string
    }

    interface WorkspaceSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      status?: string
      employeeId?: string
      tenantId?: string
    }

    type RecruitmentEntity =
      'requisition' | 'candidate' | 'interview' | 'offer' | 'handoff' | 'task'

    interface RecruitmentReference {
      id: string
      tenantId?: string
      code?: string
      name: string
      organizationName?: string
      positionName?: string
      requisitionNo?: string
      candidateId?: string
      proposedOnboardDate?: string
      plannedOnboardDate?: string
      stage?: string
    }

    interface RecruitmentBaseRecord {
      id?: string
      tenantId?: string
      createBy?: string | null
      createTime?: string
      updateBy?: string | null
      updateTime?: string
    }

    interface RecruitmentRequisition extends RecruitmentBaseRecord {
      requisitionNo: string
      organizationId: string
      positionId: string
      openingCount: number
      hiredCount?: number
      expectedOnboardDate?: string | null
      employmentType: EmploymentType
      status: string
      reason: string
      requirements?: string | null
      candidateCount?: number
      interviewCount?: number
      offerCount?: number
      organization?: RecruitmentReference
      position?: RecruitmentReference
    }

    interface RecruitmentCandidate extends RecruitmentBaseRecord {
      requisitionId: string
      candidateName: string
      phone?: string | null
      email?: string | null
      source: string
      stage: string
      expectedSalary?: number | null
      resumeUrl?: string | null
      remark?: string | null
      consentStatus: string
      consentAt?: string | null
      retentionUntil?: string | null
      rejectionReason?: string | null
      onboardEmployeeId?: string | null
      interviewCount?: number
      latestOfferStatus?: string | null
      stageChangedAt?: string | null
      requisition?: RecruitmentReference
    }

    interface RecruitmentInterview extends RecruitmentBaseRecord {
      candidateId: string
      roundNo: number
      interviewType: string
      scheduledStartAt: string
      scheduledEndAt: string
      location?: string | null
      interviewerEmployeeId: string
      status: string
      score?: number | null
      recommendation?: string | null
      feedback?: string | null
      completedAt?: string | null
      candidate?: RecruitmentReference
      interviewer?: RecruitmentReference
    }

    interface RecruitmentOffer extends RecruitmentBaseRecord {
      candidateId: string
      offerNo: string
      versionNo: number
      employmentType: EmploymentType
      monthlySalary?: number | null
      targetBonus?: number | null
      currency: string
      probationMonths: number
      proposedOnboardDate: string
      expiresOn: string
      status: string
      approvalComment?: string | null
      approvedBy?: string | null
      approvedAt?: string | null
      sentAt?: string | null
      respondedAt?: string | null
      responseNote?: string | null
      candidate?: RecruitmentReference
    }

    interface RecruitmentHandoff extends RecruitmentBaseRecord {
      candidateId: string
      offerId: string
      organizationId: string
      positionId: string
      plannedOnboardDate: string
      ownerEmployeeId?: string | null
      buddyEmployeeId?: string | null
      onboardEmployeeId?: string | null
      status: string
      handoffNote?: string | null
      completedAt?: string | null
      taskCount?: number
      completedTaskCount?: number
      overdueTaskCount?: number
      candidate?: RecruitmentReference
      offer?: RecruitmentReference
      organization?: RecruitmentReference
      position?: RecruitmentReference
      owner?: RecruitmentReference | null
      buddy?: RecruitmentReference | null
      onboardEmployee?: RecruitmentReference | null
    }

    interface RecruitmentTask extends RecruitmentBaseRecord {
      handoffId: string
      taskCategory: string
      taskTitle: string
      taskDescription?: string | null
      ownerEmployeeId?: string | null
      dueDate: string
      status: string
      completionNote?: string | null
      completedAt?: string | null
      handoff?: RecruitmentReference
      owner?: RecruitmentReference | null
    }

    type RecruitmentRecord =
      | RecruitmentRequisition
      | RecruitmentCandidate
      | RecruitmentInterview
      | RecruitmentOffer
      | RecruitmentHandoff
      | RecruitmentTask

    interface RecruitmentOverview {
      activeRequisitionCount: number
      openCandidateCount: number
      upcomingInterviewCount: number
      awaitingOfferResponseCount: number
      acceptedOfferCount: number
      pendingHandoffCount: number
      overdueTaskCount: number
      hiredCandidateCount: number
    }

    interface RecruitmentSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      status?: string
      tenantId?: string
    }

    interface RecruitmentListResult<TRecord extends RecruitmentRecord = RecruitmentRecord> {
      records: TRecord[]
      total: number
      sensitiveAccess: boolean
    }

    type WorkforceRiskKind = 'contract' | 'qualification' | 'headcount' | 'probation'
    type WorkforceRiskLevel = 'critical' | 'warning' | 'attention'

    interface WorkforceRiskItem {
      id: string
      kind: WorkforceRiskKind
      level: WorkforceRiskLevel
      title: string
      subject: string
      dueDate?: string | null
      daysRemaining?: number | null
      description: string
      routePath: string
    }

    interface WorkforceRiskOverview {
      generatedAt: string
      activeEmployeeCount: number
      criticalCount: number
      expiringContractCount: number
      expiringQualificationCount: number
      vacancyCount: number
      probationDueCount: number
      items: WorkforceRiskItem[]
    }

    type WorkforcePlanningEntity = 'cycle' | 'line' | 'effective'
    type WorkforcePlanningOptionKind = 'plan' | 'organization' | 'position'
    type WorkforcePlanScenario = 'baseline' | 'growth' | 'efficiency' | 'restructure'
    type WorkforcePlanStatus =
      'draft' | 'submitted' | 'approved' | 'active' | 'closed' | 'cancelled'
    type WorkforcePlanPriority = 'critical' | 'high' | 'normal' | 'low'
    type WorkforcePlanAction = 'submit' | 'return' | 'cancel' | 'approve' | 'activate' | 'close'

    interface WorkforcePlanningReference {
      id: string
      tenantId?: string
      code?: string | null
      name?: string | null
      status?: string | null
      organizationId?: string | null
      headcountLimit?: number
      currentCount?: number
      periodStart?: string
      periodEnd?: string
    }

    interface WorkforcePlanCycle {
      id?: string
      tenantId?: string
      planNo: string
      planName: string
      scenario: WorkforcePlanScenario
      periodStart: string
      periodEnd: string
      baselineDate: string
      ownerEmployeeId?: string | null
      status: WorkforcePlanStatus
      budgetAmount?: number | null
      currencyCode: string
      objective?: string | null
      assumptions?: string | null
      approvedBy?: string | null
      approvedAt?: string | null
      activatedAt?: string | null
      closedAt?: string | null
      remark?: string | null
      tenant?: WorkforcePlanningReference
      owner?: WorkforcePlanningReference | null
      lineCount?: number
      baselineCount?: number
      plannedHires?: number
      plannedExits?: number
      targetCount?: number
      plannedPayroll?: number | null
      createTime?: string
      updateTime?: string
    }

    interface WorkforcePlanLine {
      id?: string
      tenantId?: string
      planId: string
      organizationId: string
      positionId: string
      baselineCount: number
      plannedHires: number
      plannedExits: number
      targetCount: number
      annualCostPerHead?: number | null
      plannedPayroll?: number | null
      demandDate?: string | null
      priority: WorkforcePlanPriority
      rationale: string
      assumptions?: string | null
      currentCount?: number
      forecastGap?: number
      requisitionCount?: number
      recruitingCount?: number
      planStatus?: WorkforcePlanStatus
      periodStart?: string
      periodEnd?: string
      plan?: WorkforcePlanningReference
      organization?: WorkforcePlanningReference
      position?: WorkforcePlanningReference
      createTime?: string
      updateTime?: string
    }

    interface WorkforceEffectiveHeadcount {
      id?: string
      tenantId?: string
      organizationId: string
      positionId: string
      approvedCount: number
      currentCount?: number
      vacancyCount?: number
      effectiveFrom?: string | null
      effectiveTo?: string | null
      enabled: boolean
      remark?: string | null
      sourcePlanLineId?: string | null
      organization?: WorkforcePlanningReference
      position?: WorkforcePlanningReference
      createTime?: string
      updateTime?: string
    }

    type WorkforcePlanningRecord =
      WorkforcePlanCycle | WorkforcePlanLine | WorkforceEffectiveHeadcount

    interface WorkforceFeaturedPlan {
      id: string
      planNo: string
      planName: string
      status: WorkforcePlanStatus
      budgetAmount?: number | null
      currencyCode: string
      baselineCount: number
      plannedHires: number
      plannedExits: number
      targetCount: number
      plannedPayroll: number
      budgetVariance?: number | null
    }

    interface WorkforcePlanningOverview {
      activePlanCount: number
      pendingApprovalCount: number
      operationalCapacity: number
      currentIncumbentCount: number
      vacancyCount: number
      overCapacityCount: number
      featuredPlan?: WorkforceFeaturedPlan | null
    }

    interface WorkforcePlanningListResult<
      TRecord extends WorkforcePlanningRecord = WorkforcePlanningRecord
    > {
      records: TRecord[]
      total: number
    }

    interface WorkforcePlanningSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      tenantId?: string
      status?: string
      planId?: string
    }

    type LifecycleEntity = 'case' | 'task' | 'template' | 'template_task'
    type LifecycleOptionKind =
      'case' | 'template' | 'employee' | 'organization' | 'position' | 'handoff'
    type LifecycleCaseType = 'onboarding' | 'regularization' | 'transfer' | 'offboarding'
    type LifecycleExecutionStatus = 'planning' | 'in_progress' | 'ready' | 'completed' | 'cancelled'
    type LifecycleTaskStatus = 'pending' | 'processing' | 'completed' | 'skipped' | 'cancelled'
    type LifecycleTemplateStatus = 'draft' | 'active' | 'inactive'
    type LifecycleOwnerRole =
      'hr' | 'manager' | 'employee' | 'it' | 'finance' | 'administration' | 'asset' | 'other'
    type LifecyclePriority = 'low' | 'normal' | 'high' | 'critical'
    type LifecycleCaseAction = 'start' | 'ready' | 'complete' | 'cancel'
    type LifecycleTaskAction = 'start' | 'complete' | 'waive' | 'reopen'
    type LifecycleTemplateAction = 'activate' | 'deactivate'

    interface LifecycleReference {
      id: string
      tenantId?: string
      code?: string | null
      name?: string | null
      status?: string | null
      caseType?: LifecycleCaseType | null
      executionStatus?: LifecycleExecutionStatus | null
      employeeId?: string | null
      organizationId?: string | null
      positionId?: string | null
    }

    interface LifecycleOverview {
      activeCaseCount: number
      dueSoonCaseCount: number
      overdueBlockingTaskCount: number
      readyCaseCount: number
      defaultTemplateCount: number
      completionRate: number
    }

    interface LifecycleCase {
      id?: string
      tenantId?: string
      caseNo: string
      employeeId: string
      caseType: LifecycleCaseType
      plannedEffectiveDate: string
      status: ApprovalStatus
      templateId?: string | null
      handoffId?: string | null
      sourceType?: 'recruitment_handoff' | null
      sourceId?: string | null
      organizationId?: string | null
      positionId?: string | null
      ownerEmployeeId?: string | null
      buddyEmployeeId?: string | null
      priority: LifecyclePriority
      executionStatus: LifecycleExecutionStatus
      actualEffectiveDate?: string | null
      startedAt?: string | null
      readyAt?: string | null
      completedAt?: string | null
      cancelledAt?: string | null
      cancellationReason?: string | null
      remark?: string | null
      employee?: LifecycleReference
      organization?: LifecycleReference | null
      position?: LifecycleReference | null
      template?: LifecycleReference | null
      owner?: LifecycleReference | null
      buddy?: LifecycleReference | null
      taskCount?: number
      closedTaskCount?: number
      openBlockingTaskCount?: number
      overdueTaskCount?: number
      createTime?: string
      updateTime?: string
    }

    interface LifecycleTask {
      id?: string
      tenantId?: string
      lifecycleCaseId: string
      templateTaskId?: string | null
      taskType: string
      taskName: string
      description?: string | null
      ownerEmployeeId?: string | null
      ownerRole: LifecycleOwnerRole
      dueDate: string
      required: boolean
      blocking: boolean
      evidenceRequired: boolean
      status: LifecycleTaskStatus
      completionNote?: string | null
      evidenceNote?: string | null
      evidenceUrl?: string | null
      startedAt?: string | null
      completedAt?: string | null
      waivedAt?: string | null
      waiverReason?: string | null
      dependencyTaskId?: string | null
      sort: number
      case?: LifecycleReference | null
      employee?: LifecycleReference | null
      owner?: LifecycleReference | null
      createTime?: string
      updateTime?: string
    }

    interface LifecycleTemplate {
      id?: string
      tenantId?: string
      templateCode: string
      templateName: string
      caseType: LifecycleCaseType
      status: LifecycleTemplateStatus
      isDefault: boolean
      description?: string | null
      taskCount?: number
      usageCount?: number
      createTime?: string
      updateTime?: string
    }

    interface LifecycleTemplateTask {
      id?: string
      tenantId?: string
      templateId: string
      taskType: string
      taskName: string
      description?: string | null
      ownerRole: LifecycleOwnerRole
      dueOffsetDays: number
      required: boolean
      blocking: boolean
      evidenceRequired: boolean
      sort: number
      template?: LifecycleReference | null
      createTime?: string
      updateTime?: string
    }

    type LifecycleRecord = LifecycleCase | LifecycleTask | LifecycleTemplate | LifecycleTemplateTask

    interface LifecycleSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      tenantId?: string
      status?: string
      caseId?: string
      templateId?: string
    }

    interface LifecycleListResult<TRecord extends LifecycleRecord = LifecycleRecord> {
      records: TRecord[]
      total: number
    }

    type ComplianceEntity = 'risk' | 'contract' | 'qualification'
    type ComplianceRecordEntity = Exclude<ComplianceEntity, 'risk'>
    type ComplianceRiskStatus = 'overdue' | 'critical' | 'due_soon' | 'watch' | 'clear'
    type ComplianceRenewalDecision = 'not_started' | 'pending' | 'renew' | 'terminate' | 'completed'
    type ComplianceVerificationStatus = 'pending' | 'verified' | 'rejected'
    type ComplianceAction =
      | 'activate'
      | 'start_renewal'
      | 'renew'
      | 'terminate'
      | 'verify'
      | 'reject'
      | 'revoke'
      | 'comment'

    interface ComplianceReference extends WorkspaceReference {
      jobTitle?: string | null
    }

    interface ComplianceOverview {
      activeContractCount: number
      contractRiskCount: number
      overdueContractCount: number
      qualificationRiskCount: number
      expiredQualificationCount: number
      pendingVerificationCount: number
      verifiedRate: number
    }

    interface ComplianceEvent {
      id: string
      tenantId?: string
      entityType: ComplianceRecordEntity
      entityId: string
      eventType: string
      fromStatus?: string | null
      toStatus?: string | null
      actorEmployeeId?: string | null
      comment?: string | null
      eventData?: Record<string, unknown>
      actor?: ComplianceReference | null
      createBy?: string | null
      createTime: string
    }

    interface ComplianceContract extends EmployeeContract {
      employeeId: string
      renewalDecision: ComplianceRenewalDecision
      riskStatus?: ComplianceRiskStatus
      daysRemaining?: number | null
      previousContractNo?: string | null
      employee?: ComplianceReference | null
      renewalOwner?: ComplianceReference | null
      events?: ComplianceEvent[]
      createTime?: string
      updateTime?: string
    }

    interface ComplianceQualification {
      id?: string
      tenantId?: string
      employeeId: string
      qualificationType: string
      qualificationName: string
      certificateNo?: string | null
      issuer?: string | null
      issueDate?: string | null
      expiryDate?: string | null
      status: string
      attachmentUrl?: string | null
      reminderDays: number
      responsibleEmployeeId?: string | null
      verificationStatus: ComplianceVerificationStatus
      verifiedByEmployeeId?: string | null
      verifiedAt?: string | null
      verificationNote?: string | null
      nextReviewDate?: string | null
      revokedAt?: string | null
      revocationReason?: string | null
      remark?: string | null
      riskStatus?: ComplianceRiskStatus
      daysRemaining?: number | null
      employee?: ComplianceReference | null
      responsibleEmployee?: ComplianceReference | null
      verifiedByEmployee?: ComplianceReference | null
      events?: ComplianceEvent[]
      createTime?: string
      updateTime?: string
    }

    interface ComplianceRisk {
      entityType: ComplianceRecordEntity
      recordId: string
      tenantId?: string
      subject: string
      status: string
      dueDate: string
      daysRemaining: number
      riskStatus: Exclude<ComplianceRiskStatus, 'clear'>
      riskType: string
      description: string
      employee: ComplianceReference
      owner?: ComplianceReference | null
    }

    type ComplianceRecord = ComplianceRisk | ComplianceContract | ComplianceQualification

    interface ComplianceSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      status?: string
      riskStatus?: string
      tenantId?: string
    }

    interface ComplianceListResult<TRecord extends ComplianceRecord = ComplianceRecord> {
      records: TRecord[]
      total: number
    }

    interface ComplianceActionPayload extends Partial<ComplianceContract> {
      comment?: string
      responsibleEmployeeId?: string | null
    }

    type ServiceDeliveryEntity = 'request' | 'service'
    type ServiceDeliveryMode = 'case' | 'redirect'
    type ServiceRequestStatus =
      | 'draft'
      | 'submitted'
      | 'assigned'
      | 'in_progress'
      | 'waiting_employee'
      | 'resolved'
      | 'closed'
      | 'cancelled'
    type ServiceRequestPriority = 'low' | 'normal' | 'high' | 'urgent'
    type ServiceRequestChannel = 'self_service' | 'agent' | 'email' | 'phone'
    type ServiceRequestSlaStatus = 'clear' | 'on_track' | 'at_risk' | 'breached'
    type ServiceRequestAction =
      | 'submit'
      | 'assign'
      | 'start'
      | 'wait'
      | 'resume'
      | 'resolve'
      | 'close'
      | 'reopen'
      | 'cancel'
      | 'comment'

    interface ServiceDeliveryReference {
      id: string
      tenantId?: string
      code?: string | null
      name?: string | null
      category?: string | null
      routingGroup?: string | null
      jobTitle?: string | null
    }

    interface ServiceDeliveryOverview {
      availableServiceCount: number
      openRequestCount: number
      slaRiskCount: number
      unassignedCount: number
      resolvedMonthCount: number
      responseOnTimeRate: number
      managerView: boolean
    }

    interface ServiceCatalog {
      id?: string
      tenantId?: string
      serviceCode: string
      serviceName: string
      category: string
      description?: string | null
      serviceMode: ServiceDeliveryMode
      routePath?: string | null
      routingGroup?: string | null
      firstResponseHours: number
      resolutionHours: number
      enabled: boolean
      sort: number
      requestCount?: number
      createTime?: string
      updateTime?: string
    }

    interface ServiceRequestEvent {
      id: string
      tenantId?: string
      requestId: string
      eventType: string
      fromStatus?: ServiceRequestStatus | null
      toStatus?: ServiceRequestStatus | null
      actorEmployeeId?: string | null
      comment?: string | null
      eventData?: Record<string, unknown>
      actor?: ServiceDeliveryReference | null
      createBy?: string | null
      createTime: string
    }

    interface ServiceRequest {
      id?: string
      tenantId?: string
      requestNo: string
      employeeId: string
      serviceId: string
      requestType: string
      title: string
      reason: string
      priority: ServiceRequestPriority
      channel: ServiceRequestChannel
      status: ServiceRequestStatus
      assignedEmployeeId?: string | null
      firstResponseDueAt?: string | null
      resolutionDueAt?: string | null
      firstRespondedAt?: string | null
      resolvedAt?: string | null
      closedAt?: string | null
      waitingStartedAt?: string | null
      waitingReason?: string | null
      resolution?: string | null
      attachmentUrls: string[]
      reopenCount: number
      lastActivityAt?: string
      slaStatus?: ServiceRequestSlaStatus
      service?: ServiceDeliveryReference | null
      requester?: ServiceDeliveryReference | null
      assignee?: ServiceDeliveryReference | null
      events?: ServiceRequestEvent[]
      createTime?: string
      updateTime?: string
    }

    type ServiceDeliveryRecord = ServiceCatalog | ServiceRequest

    interface ServiceDeliverySearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      status?: string
      category?: string
      scope?: 'mine' | 'team'
      tenantId?: string
    }

    interface ServiceDeliveryListResult<
      TRecord extends ServiceDeliveryRecord = ServiceDeliveryRecord
    > {
      records: TRecord[]
      total: number
    }

    type EmployeeRelationEntity = 'case' | 'action'
    type EmployeeRelationCaseStatus =
      | 'draft'
      | 'reported'
      | 'triaged'
      | 'investigating'
      | 'action_required'
      | 'resolved'
      | 'closed'
      | 'cancelled'
    type EmployeeRelationActionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'
    type EmployeeRelationDueStatus = 'clear' | 'on_track' | 'due_soon' | 'overdue'
    type EmployeeRelationCaseAction =
      | 'submit'
      | 'triage'
      | 'start_investigation'
      | 'require_action'
      | 'resolve'
      | 'close'
      | 'reopen'
      | 'cancel'
      | 'comment'
    type EmployeeRelationActionAction = 'start' | 'complete' | 'cancel'

    interface EmployeeRelationReference {
      id: string
      tenantId?: string
      employeeNo?: string | null
      employeeName?: string | null
      jobTitle?: string | null
      organizationName?: string | null
      positionName?: string | null
    }

    interface EmployeeRelationOverview {
      openCaseCount: number
      criticalCaseCount: number
      unassignedCaseCount: number
      overdueCaseCount: number
      overdueActionCount: number
      resolvedMonthCount: number
      sensitiveAccess: boolean
    }

    interface EmployeeRelationCaseSummary {
      id: string
      caseNo: string
      title: string
      caseType: string
      status: EmployeeRelationCaseStatus
      severity: string
    }

    interface EmployeeRelationAction {
      id?: string
      tenantId?: string
      caseId: string
      actionType: string
      title: string
      ownerEmployeeId: string
      dueDate: string
      status: EmployeeRelationActionStatus
      startedAt?: string | null
      completedAt?: string | null
      completionNote?: string | null
      remark?: string | null
      relationCase?: EmployeeRelationCaseSummary
      ownerEmployee?: EmployeeRelationReference
      dueStatus?: EmployeeRelationDueStatus
      createTime?: string
      updateTime?: string
    }

    interface EmployeeRelationEvent {
      id: string
      tenantId?: string
      caseId: string
      eventType: string
      fromStatus?: EmployeeRelationCaseStatus | null
      toStatus?: EmployeeRelationCaseStatus | null
      actorEmployeeId?: string | null
      comment?: string | null
      eventData?: Record<string, unknown>
      actor?: EmployeeRelationReference | null
      createBy?: string | null
      createTime: string
    }

    interface EmployeeRelationCase {
      id?: string
      tenantId?: string
      caseNo: string
      caseType: string
      title: string
      subjectEmployeeId: string
      reporterEmployeeId?: string | null
      anonymousReport: boolean
      source: string
      severity: string
      confidentialityLevel: string
      status: EmployeeRelationCaseStatus
      ownerEmployeeId?: string | null
      reportedAt?: string | null
      targetResolutionDate?: string | null
      triagedAt?: string | null
      investigationStartedAt?: string | null
      resolvedAt?: string | null
      closedAt?: string | null
      allegationSummary?: string
      findingsSummary?: string | null
      outcome?: string | null
      resolutionSummary?: string | null
      attachmentUrls?: string[]
      externalReference?: string | null
      remark?: string | null
      subjectEmployee?: EmployeeRelationReference
      reporterEmployee?: EmployeeRelationReference | null
      ownerEmployee?: EmployeeRelationReference | null
      actions?: EmployeeRelationAction[]
      events?: EmployeeRelationEvent[]
      sensitiveRestricted?: boolean
      dueStatus?: EmployeeRelationDueStatus
      openActionCount?: number
      createTime?: string
      updateTime?: string
    }

    type EmployeeRelationRecord = EmployeeRelationCase | EmployeeRelationAction

    interface EmployeeRelationSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      status?: string
      caseType?: string
      severity?: string
      tenantId?: string
    }

    interface EmployeeRelationListResult<
      TRecord extends EmployeeRelationRecord = EmployeeRelationRecord
    > {
      records: TRecord[]
      total: number
    }

    interface EmployeeRelationCaseActionPayload {
      ownerEmployeeId?: string
      targetResolutionDate?: string
      severity?: string
      confidentialityLevel?: string
      findingsSummary?: string
      outcome?: string
      resolutionSummary?: string
      comment?: string
    }

    type BenefitEntity = 'plan' | 'enrollment' | 'event'
    type BenefitRecordKind = BenefitEntity | 'option'
    type BenefitPlanStatus = 'draft' | 'active' | 'inactive' | 'cancelled'
    type BenefitEnrollmentStatus = 'draft' | 'pending' | 'active' | 'waived' | 'ended' | 'cancelled'
    type BenefitLifeEventStatus = 'open' | 'processed' | 'expired' | 'cancelled'
    type BenefitDueStatus = 'clear' | 'due_soon' | 'expiring' | 'expired'
    type BenefitTransitionAction =
      | 'activate'
      | 'deactivate'
      | 'reactivate'
      | 'submit'
      | 'approve'
      | 'reject'
      | 'end'
      | 'process'
      | 'cancel'

    interface BenefitReference {
      id: string
      tenantId?: string
      employeeNo?: string | null
      employeeName?: string | null
      jobTitle?: string | null
      organizationName?: string | null
      positionName?: string | null
      planCode?: string | null
      planName?: string | null
      planType?: string | null
      optionCode?: string | null
      optionName?: string | null
      coverageLevel?: string | null
      eventType?: string | null
      eventDate?: string | null
      currencyCode?: string | null
      status?: string | null
    }

    interface BenefitOverview {
      activePlanCount: number
      activeEnrollmentCount: number
      pendingEnrollmentCount: number
      openEventCount: number
      expiringEventCount: number
      monthlyEmployeeContribution?: number | null
      monthlyEmployerContribution?: number | null
      amountVisible: boolean
    }

    interface BenefitPlan {
      id?: string
      tenantId?: string
      planCode: string
      planName: string
      planType: string
      providerName?: string | null
      enrollmentMethod: 'automatic' | 'election'
      coverageScope: 'employee' | 'employee_family'
      currencyCode: string
      effectiveFrom: string
      effectiveTo?: string | null
      status: BenefitPlanStatus
      description?: string | null
      optionCount?: number
      activeEnrollmentCount?: number
      options?: BenefitOption[]
      events?: BenefitAuditEvent[]
      amountVisible?: boolean
      createTime?: string
      updateTime?: string
    }

    interface BenefitOption {
      id?: string
      tenantId?: string
      planId: string
      optionCode: string
      optionName: string
      coverageLevel: string
      contributionType: 'fixed' | 'salary_rate'
      employeeContribution?: number | null
      employerContribution?: number | null
      employeeRate?: number | null
      employerRate?: number | null
      payComponentId?: string | null
      enabled: boolean
      sort: number
      description?: string | null
      plan?: BenefitReference
      createTime?: string
      updateTime?: string
    }

    interface BenefitLifeEvent {
      id?: string
      tenantId?: string
      employeeId: string
      eventType: string
      eventDate: string
      enrollmentWindowEnd: string
      status: BenefitLifeEventStatus
      evidenceUrls: string[]
      evidenceRestricted?: boolean
      remark?: string | null
      processedAt?: string | null
      dueStatus?: BenefitDueStatus
      employee?: BenefitReference
      enrollments?: Array<{
        id: string
        enrollmentNo: string
        status: BenefitEnrollmentStatus
        planId: string
        planName: string
        optionName: string
      }>
      events?: BenefitAuditEvent[]
      createTime?: string
      updateTime?: string
    }

    interface BenefitEnrollment {
      id?: string
      tenantId?: string
      employeeId: string
      planId: string
      optionId: string
      lifeEventId?: string | null
      enrollmentNo: string
      coverageFrom: string
      coverageTo?: string | null
      status: BenefitEnrollmentStatus
      waiverReason?: string | null
      employeeContribution?: number | null
      employerContribution?: number | null
      currencyCode: string
      payrollSyncStatus: string
      approvedBy?: string | null
      approvedAt?: string | null
      endedAt?: string | null
      remark?: string | null
      dueStatus?: BenefitDueStatus
      employee?: BenefitReference
      plan?: BenefitReference
      option?: BenefitReference
      lifeEvent?: BenefitReference | null
      events?: BenefitAuditEvent[]
      amountVisible?: boolean
      createTime?: string
      updateTime?: string
    }

    interface BenefitAuditEvent {
      id: string
      tenantId: string
      entityType: BenefitRecordKind
      entityId: string
      eventType: string
      fromStatus?: string | null
      toStatus?: string | null
      summary: string
      payload: Record<string, unknown>
      actorUserId?: string | null
      actorName?: string | null
      createTime: string
    }

    type BenefitRecord = BenefitPlan | BenefitEnrollment | BenefitLifeEvent

    interface BenefitSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      status?: string
      planType?: string
      tenantId?: string
      from?: number
      to?: number
    }

    interface BenefitListResult<TRecord extends BenefitRecord = BenefitRecord> {
      records: TRecord[]
      total: number
      amountVisible?: boolean
    }

    interface BenefitPayrollInput {
      enrollmentId: string
      enrollmentNo: string
      tenantId: string
      employeeId: string
      employeeNo: string
      employeeName: string
      planId: string
      planCode: string
      planName: string
      planType: string
      optionId: string
      optionCode: string
      optionName: string
      payComponentId?: string | null
      employeeContribution: number
      employerContribution: number
      currencyCode: string
      coverageFrom: string
      coverageTo?: string | null
    }

    type EmployeeExperienceEntity = 'my' | 'survey' | 'insight' | 'action'
    type EmployeeExperienceRecordKind = 'survey' | 'question' | 'action'
    type EmployeeExperienceSurveyStatus = 'draft' | 'scheduled' | 'open' | 'closed' | 'cancelled'
    type EmployeeExperienceParticipantStatus = 'invited' | 'completed' | 'declined'
    type EmployeeExperienceAvailability = 'available' | 'completed' | 'expired' | 'unavailable'
    type EmployeeExperienceActionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'
    type EmployeeExperienceDueStatus = 'clear' | 'due_soon' | 'overdue'
    type EmployeeExperienceRiskLevel = 'healthy' | 'medium' | 'high'
    type EmployeeExperienceTransitionAction =
      'launch' | 'open' | 'close' | 'cancel' | 'start' | 'complete'

    interface EmployeeExperienceOverview {
      openSurveyCount: number
      myPendingCount: number
      participantCount: number
      completedCount: number
      responseRate?: number | null
      lowDimensionCount: number
      openActionCount: number
      overdueActionCount: number
      insightsVisible: boolean
      commentsVisible: boolean
      respondVisible: boolean
    }

    interface EmployeeExperienceReference {
      id: string
      tenantId?: string
      surveyCode?: string | null
      surveyName?: string | null
      surveyType?: string | null
      organizationName?: string | null
      employeeNo?: string | null
      employeeName?: string | null
      jobTitle?: string | null
    }

    interface EmployeeExperienceQuestion {
      id?: string
      tenantId?: string
      surveyId: string
      dimension: string
      questionText: string
      answerType: 'rating_5' | 'enps_11' | 'open_text'
      required: boolean
      enabled: boolean
      sort: number
      createTime?: string
      updateTime?: string
    }

    interface EmployeeExperienceEvent {
      id: string
      tenantId: string
      entityType: 'survey' | 'action'
      entityId: string
      eventType: string
      fromStatus?: string | null
      toStatus?: string | null
      summary: string
      payload: Record<string, unknown>
      actorUserId?: string | null
      actorName?: string | null
      createTime: string
    }

    interface EmployeeExperienceSurvey {
      id?: string
      tenantId?: string
      surveyCode: string
      surveyName: string
      surveyType: string
      cadence: string
      audienceType: 'all_active' | 'organization'
      audienceOrganizationId?: string | null
      audienceOrganizationName?: string | null
      minimumGroupSize: number
      startDate: string
      endDate: string
      status: EmployeeExperienceSurveyStatus
      description?: string | null
      launchedAt?: string | null
      closedAt?: string | null
      questionCount?: number
      participantCount?: number
      completedCount?: number
      responseRate?: number
      audienceOrganization?: EmployeeExperienceReference | null
      questions?: EmployeeExperienceQuestion[]
      events?: EmployeeExperienceEvent[]
      createTime?: string
      updateTime?: string
    }

    interface EmployeeExperienceMySurvey {
      id: string
      tenantId: string
      surveyId: string
      surveyCode: string
      surveyName: string
      surveyType: string
      cadence: string
      status: EmployeeExperienceParticipantStatus
      assignedOn: string
      completedOn?: string | null
      startDate: string
      endDate: string
      description?: string | null
      minimumGroupSize: number
      questionCount: number
      availability: EmployeeExperienceAvailability
      survey?: EmployeeExperienceSurvey
      questions?: EmployeeExperienceQuestion[]
      privacyNote?: string
    }

    interface EmployeeExperienceInsight {
      surveyId: string
      tenantId: string
      surveyCode: string
      surveyName: string
      surveyType: string
      surveyStatus: EmployeeExperienceSurveyStatus
      minimumGroupSize: number
      dimension: string
      respondentCount: number
      questionCount: number
      scorePercent: number
      riskLevel: EmployeeExperienceRiskLevel
      actionCount: number
    }

    interface EmployeeExperienceQuestionScore {
      questionId: string
      questionText: string
      answerType: 'rating_5' | 'enps_11'
      respondentCount: number
      scorePercent: number
    }

    interface EmployeeExperienceOrganizationScore {
      organizationId: string
      organizationName: string
      respondentCount: number
      scorePercent: number
    }

    interface EmployeeExperienceComment {
      questionText: string
      text: string
      submittedAt: string
    }

    interface EmployeeExperienceInsightDetail extends EmployeeExperienceSurvey {
      dimension: string
      respondentCount: number
      privacyThresholdMet: boolean
      questionScores: EmployeeExperienceQuestionScore[]
      organizationScores: EmployeeExperienceOrganizationScore[]
      commentsRestricted: boolean
      comments: EmployeeExperienceComment[]
      actions: EmployeeExperienceAction[]
    }

    interface EmployeeExperienceAction {
      id?: string
      tenantId?: string
      surveyId: string
      organizationId?: string | null
      dimension: string
      title: string
      ownerEmployeeId: string
      dueDate: string
      status: EmployeeExperienceActionStatus
      successMeasure: string
      progressNote?: string | null
      resultSummary?: string | null
      startedAt?: string | null
      completedAt?: string | null
      surveyCode?: string
      surveyName?: string
      organizationName?: string | null
      ownerEmployeeNo?: string
      ownerEmployeeName?: string
      ownerJobTitle?: string | null
      dueStatus?: EmployeeExperienceDueStatus
      survey?: EmployeeExperienceReference
      organization?: EmployeeExperienceReference | null
      ownerEmployee?: EmployeeExperienceReference
      events?: EmployeeExperienceEvent[]
      createTime?: string
      updateTime?: string
    }

    type EmployeeExperienceRecord =
      | EmployeeExperienceMySurvey
      | EmployeeExperienceSurvey
      | EmployeeExperienceInsight
      | EmployeeExperienceAction

    interface EmployeeExperienceSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      status?: string
      surveyType?: string
      tenantId?: string
      from?: number
      to?: number
    }

    interface EmployeeExperienceListResult<
      TRecord extends EmployeeExperienceRecord = EmployeeExperienceRecord
    > {
      records: TRecord[]
      total: number
      privacyNote?: string
    }

    interface EmployeeExperienceAnswerInput {
      questionId: string
      numericScore?: number
      textAnswer?: string
    }

    type TimeAttendanceEntity = 'record' | 'assignment' | 'correction' | 'period' | 'shift'
    type TimeAttendanceOptionKind = 'employee' | 'shift' | 'record'
    type TimeAttendanceExceptionStatus = 'clear' | 'open' | 'resolved' | 'waived'
    type TimeAttendanceCorrectionStatus =
      'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled'
    type TimeAttendancePeriodStatus = 'open' | 'reviewing' | 'closed'
    type TimeAttendanceCorrectionAction = 'submit' | 'approve' | 'reject' | 'cancel'
    type TimeAttendanceRecordAction = 'evaluate' | 'waive' | 'reopen'
    type TimeAttendancePeriodAction = 'review' | 'close' | 'reopen'

    interface TimeAttendanceReference {
      id: string
      tenantId?: string
      code?: string | null
      name?: string | null
      startTime?: string | null
      endTime?: string | null
      timeZone?: string | null
      employeeId?: string | null
      workDate?: string | null
      clockInAt?: string | null
      clockOutAt?: string | null
      exceptionStatus?: TimeAttendanceExceptionStatus | null
    }

    interface TimeAttendanceOverview {
      activeShiftCount: number
      todayAssignmentCount: number
      openExceptionCount: number
      pendingCorrectionCount: number
      reviewingPeriodCount: number
      monthCompletionRate: number
    }

    interface TimeAttendanceShift {
      id?: string
      tenantId?: string
      shiftCode: string
      shiftName: string
      shiftType: string
      startTime: string
      endTime: string
      breakMinutes: number
      crossDay: boolean
      enabled: boolean
      timeZone: string
      lateGraceMinutes: number
      earlyLeaveGraceMinutes: number
      remark?: string | null
      usageCount?: number
      createTime?: string
      updateTime?: string
    }

    interface TimeAttendanceAssignment {
      id?: string
      tenantId?: string
      employeeId: string
      shiftId: string
      workDate: string
      assignmentStatus: 'scheduled' | 'worked' | 'leave' | 'cancelled'
      remark?: string | null
      employee?: TimeAttendanceReference
      shift?: TimeAttendanceReference
      createTime?: string
      updateTime?: string
    }

    interface TimeAttendanceDailyRecord {
      id?: string
      tenantId?: string
      employeeId: string
      shiftId?: string | null
      workDate: string
      clockInAt?: string | null
      clockOutAt?: string | null
      workMinutes: number
      overtimeMinutes: number
      scheduledMinutes: number
      lateMinutes: number
      earlyLeaveMinutes: number
      absenceMinutes: number
      payableMinutes: number
      attendanceStatus: string
      exceptionStatus: TimeAttendanceExceptionStatus
      source: string
      sourceReference?: string | null
      valuationNote?: string | null
      remark?: string | null
      lockedAt?: string | null
      lockedBy?: string | null
      pendingCorrection?: boolean
      employee?: TimeAttendanceReference
      shift?: TimeAttendanceReference | null
      createTime?: string
      updateTime?: string
    }

    interface TimeAttendanceCorrection {
      id?: string
      tenantId?: string
      correctionNo?: string
      attendanceRecordId: string
      employeeId?: string
      requestedClockInAt?: string | null
      requestedClockOutAt?: string | null
      reason: string
      proofUrls: string[]
      status: TimeAttendanceCorrectionStatus
      submittedAt?: string | null
      reviewedAt?: string | null
      reviewedBy?: string | null
      reviewComment?: string | null
      originalSnapshot?: Record<string, unknown>
      employee?: TimeAttendanceReference
      record?: TimeAttendanceReference | null
      createTime?: string
      updateTime?: string
    }

    interface TimeAttendancePeriod {
      id?: string
      tenantId?: string
      periodMonth: string
      status: TimeAttendancePeriodStatus
      recordCount: number
      exceptionCount: number
      totalScheduledMinutes: number
      totalPayableMinutes: number
      totalOvertimeMinutes: number
      reviewedAt?: string | null
      reviewedBy?: string | null
      closedAt?: string | null
      closedBy?: string | null
      closeNote?: string | null
      createTime?: string
      updateTime?: string
    }

    type TimeAttendanceRecord =
      | TimeAttendanceShift
      | TimeAttendanceAssignment
      | TimeAttendanceDailyRecord
      | TimeAttendanceCorrection
      | TimeAttendancePeriod

    interface TimeAttendanceSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      tenantId?: string
      status?: string
      periodMonth?: string
    }

    interface TimeAttendanceListResult<
      TRecord extends TimeAttendanceRecord = TimeAttendanceRecord
    > {
      records: TRecord[]
      total: number
    }

    type PerformanceEntity =
      'cycle' | 'review' | 'goal' | 'check_in' | 'calibration' | 'calibration_item'
    type PerformanceOptionKind = 'cycle' | 'review' | 'employee' | 'organization' | 'calibration'
    type PerformanceCycleStatus = 'draft' | 'active' | 'reviewing' | 'completed' | 'cancelled'
    type PerformanceReviewStatus =
      'draft' | 'self_review' | 'manager_review' | 'confirmed' | 'completed' | 'cancelled'
    type PerformanceGoalStatus = 'draft' | 'in_progress' | 'at_risk' | 'completed'
    type PerformanceCalibrationStatus = 'setup' | 'in_progress' | 'approved' | 'deactivated'
    type PerformanceLevel = 's' | 'a' | 'b' | 'c' | 'd'
    type PerformanceCycleAction = 'activate' | 'begin_review' | 'complete' | 'cancel'
    type PerformanceReviewAction = 'submit_self' | 'submit_manager' | 'complete'
    type PerformanceCalibrationAction = 'start' | 'approve' | 'deactivate'

    interface PerformanceReference {
      id: string
      tenantId?: string
      code?: string | null
      name?: string | null
      status?: string | null
      organizationId?: string | null
      cycleId?: string | null
    }

    interface PerformanceCycle {
      id?: string
      tenantId?: string
      cycleCode: string
      cycleName: string
      startDate: string
      endDate: string
      status: PerformanceCycleStatus
      description?: string | null
      ownerEmployeeId?: string | null
      checkInFrequencyDays: number
      selfReviewDueDate?: string | null
      managerReviewDueDate?: string | null
      calibrationDueDate?: string | null
      activatedAt?: string | null
      completedAt?: string | null
      owner?: PerformanceReference | null
      reviewCount?: number
      completedCount?: number
      pendingCalibrationCount?: number
      createTime?: string
      updateTime?: string
    }

    interface PerformanceReview {
      id?: string
      tenantId?: string
      cycleId: string
      employeeId: string
      reviewerEmployeeId?: string | null
      status: PerformanceReviewStatus
      selfScore?: number | null
      managerScore?: number | null
      calibratedScore?: number | null
      calibratedLevel?: PerformanceLevel | null
      totalScore?: number | null
      performanceLevel?: PerformanceLevel | null
      employeeSummary?: string | null
      reviewerComment?: string | null
      calibrationComment?: string | null
      submittedAt?: string | null
      managerReviewedAt?: string | null
      confirmedAt?: string | null
      completedAt?: string | null
      goalCount?: number
      goalWeight?: number
      lastCheckInDate?: string | null
      latestRiskStatus?: string | null
      latestProgressPercent?: number | null
      cycle?: PerformanceReference
      employee?: PerformanceReference
      reviewer?: PerformanceReference | null
      organization?: PerformanceReference | null
      createTime?: string
      updateTime?: string
    }

    interface PerformanceGoal {
      id?: string
      tenantId?: string
      reviewId: string
      goalName: string
      targetDescription: string
      goalType: 'business' | 'customer' | 'operations' | 'safety' | 'development'
      weight: number
      progressPercent: number
      status: PerformanceGoalStatus
      dueDate?: string | null
      actualResult?: string | null
      evidenceSource?: string | null
      employeeScore?: number | null
      managerScore?: number | null
      employeeId?: string
      cycleId?: string
      reviewStatus?: PerformanceReviewStatus
      employee?: PerformanceReference
      cycle?: PerformanceReference
      createTime?: string
      updateTime?: string
    }

    interface PerformanceCheckIn {
      id?: string
      tenantId?: string
      reviewId: string
      checkInDate: string
      progressPercent: number
      riskStatus: 'on_track' | 'attention' | 'off_track'
      achievement?: string | null
      blocker?: string | null
      nextAction: string
      managerFeedback?: string | null
      facilitatorEmployeeId?: string | null
      employeeId?: string
      cycleId?: string
      employee?: PerformanceReference
      cycle?: PerformanceReference
      facilitator?: PerformanceReference | null
      createTime?: string
      updateTime?: string
    }

    interface PerformanceCalibrationSession {
      id?: string
      tenantId?: string
      sessionNo: string
      sessionName: string
      cycleId: string
      organizationId?: string | null
      facilitatorEmployeeId?: string | null
      scheduledAt: string
      status: PerformanceCalibrationStatus
      distributionNote?: string | null
      decisionNote?: string | null
      approvedAt?: string | null
      itemCount?: number
      adjustedCount?: number
      cycle?: PerformanceReference
      organization?: PerformanceReference | null
      facilitator?: PerformanceReference | null
      createTime?: string
      updateTime?: string
    }

    interface PerformanceCalibrationItem {
      id?: string
      tenantId?: string
      sessionId: string
      reviewId: string
      originalScore: number
      originalLevel: PerformanceLevel
      calibratedScore: number
      calibratedLevel: PerformanceLevel
      adjustmentReason?: string | null
      employeeId?: string
      cycleId?: string
      session?: PerformanceReference
      employee?: PerformanceReference
      cycle?: PerformanceReference
      createTime?: string
      updateTime?: string
    }

    type PerformanceRecord =
      | PerformanceCycle
      | PerformanceReview
      | PerformanceGoal
      | PerformanceCheckIn
      | PerformanceCalibrationSession
      | PerformanceCalibrationItem

    interface PerformanceFeaturedCycle {
      id: string
      cycleCode: string
      cycleName: string
      status: PerformanceCycleStatus
      startDate: string
      endDate: string
      goalSettingCount: number
      managerReviewCount: number
      calibrationCount: number
      completedCount: number
    }

    interface PerformanceOverview {
      activeCycleCount: number
      inScopeEmployeeCount: number
      completionRate: number
      atRiskCheckInCount: number
      pendingCalibrationCount: number
      featuredCycle?: PerformanceFeaturedCycle | null
    }

    interface PerformanceListResult<TRecord extends PerformanceRecord = PerformanceRecord> {
      records: TRecord[]
      total: number
    }

    interface PerformanceSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      tenantId?: string
      status?: string
      cycleId?: string
      sessionId?: string
    }

    type LearningEntity =
      'plan' | 'course' | 'course_competency' | 'session' | 'enrollment' | 'certificate'
    type LearningOptionKind = 'plan' | 'course' | 'session' | 'competency'
    type LearningPlanStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled'
    type LearningCourseStatus = 'draft' | 'published' | 'retired'
    type LearningSessionStatus = 'planned' | 'open' | 'in_progress' | 'completed' | 'cancelled'
    type LearningEnrollmentStatus =
      'enrolled' | 'attending' | 'passed' | 'failed' | 'withdrawn' | 'no_show'
    type LearningCertificateStatus = 'valid' | 'expired' | 'revoked'

    interface LearningReference {
      id: string
      tenantId?: string
      code?: string | null
      name?: string | null
      status?: string | null
      planId?: string | null
      courseId?: string | null
      startAt?: string | null
      endAt?: string | null
      durationHours?: number | null
    }

    interface LearningPlan {
      id?: string
      tenantId?: string
      planCode: string
      planName: string
      trainingType: string
      startDate: string
      endDate?: string | null
      providerName?: string | null
      budget?: number | null
      actualCost?: number | null
      status: LearningPlanStatus
      objective?: string | null
      remark?: string | null
      ownerEmployeeId?: string | null
      targetAudience?: string | null
      mandatory: boolean
      approvedBy?: string | null
      approvedAt?: string | null
      owner?: LearningReference | null
      sessionCount?: number
      learnerCount?: number
      createTime?: string
      updateTime?: string
    }

    interface LearningCourse {
      id?: string
      tenantId?: string
      courseCode: string
      courseName: string
      category: string
      deliveryMode: string
      durationHours: number
      creditHours: number
      providerName?: string | null
      passingScore?: number | null
      minimumAttendancePercent: number
      certificateEnabled: boolean
      certificateValidMonths?: number | null
      status: LearningCourseStatus
      description?: string | null
      learningObjectives?: string | null
      targetAudience?: string | null
      sessionCount?: number
      competencyCount?: number
      createTime?: string
      updateTime?: string
    }

    interface LearningSession {
      id?: string
      tenantId?: string
      sessionCode: string
      planId: string
      courseId: string
      startAt: string
      endAt: string
      enrollmentDeadline?: string | null
      capacity: number
      instructorName?: string | null
      location?: string | null
      meetingUrl?: string | null
      estimatedCost?: number | null
      actualCost?: number | null
      status: LearningSessionStatus
      completionNote?: string | null
      plan?: LearningReference
      course?: LearningReference
      enrollmentCount?: number
      passedCount?: number
      createTime?: string
      updateTime?: string
    }

    interface LearningCourseCompetency {
      id?: string
      tenantId?: string
      courseId: string
      competencyId: string
      targetLevel: string
      course?: LearningReference
      competency?: LearningReference
      createTime?: string
      updateTime?: string
    }

    interface LearningEnrollment {
      id?: string
      tenantId?: string
      planId: string
      sessionId: string
      employeeId: string
      status: LearningEnrollmentStatus
      attendancePercent?: number | null
      score?: number | null
      result?: string | null
      certificateNo?: string | null
      completedAt?: string | null
      completionComment?: string | null
      nominatedByEmployeeId?: string | null
      remark?: string | null
      employee?: LearningReference
      session?: LearningReference
      plan?: LearningReference
      course?: LearningReference
      nominator?: LearningReference | null
      createTime?: string
      updateTime?: string
    }

    interface LearningCertificate {
      id?: string
      tenantId?: string
      enrollmentId: string
      employeeId: string
      courseId: string
      certificateNo: string
      certificateName: string
      issuedOn: string
      expiresOn?: string | null
      credentialUrl?: string | null
      status: LearningCertificateStatus
      revokedReason?: string | null
      revokedAt?: string | null
      employee?: LearningReference
      course?: LearningReference
      createTime?: string
      updateTime?: string
    }

    type LearningRecord =
      | LearningPlan
      | LearningCourse
      | LearningCourseCompetency
      | LearningSession
      | LearningEnrollment
      | LearningCertificate

    interface LearningOverview {
      publishedCourseCount: number
      openSessionCount: number
      activeLearnerCount: number
      completionRate: number
      expiringCertificateCount: number
      budgetExecutionRate: number
    }

    interface LearningListResult<TRecord extends LearningRecord = LearningRecord> {
      records: TRecord[]
      total: number
    }

    interface LearningSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      tenantId?: string
      status?: string
    }

    type SuccessionEntity = 'plan' | 'candidate' | 'action'
    type SuccessionPlanStatus = 'draft' | 'active' | 'closed'
    type SuccessionReadiness =
      'ready_now' | 'one_to_two_years' | 'three_to_five_years' | 'development_needed'
    type SuccessionCandidateStatus = 'nominated' | 'active' | 'withdrawn' | 'placed'
    type SuccessionActionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

    interface SuccessionReference {
      id: string
      tenantId: string
      code?: string
      name: string
      positionName?: string | null
      organizationName?: string | null
      jobTitle?: string | null
      employeeId?: string
      employeeNo?: string
      employeeName?: string
      planName?: string
    }

    interface SuccessionPlan {
      id?: string
      tenantId?: string
      planCode: string
      positionId: string
      planName: string
      criticality: 'medium' | 'high' | 'critical'
      vacancyRisk: 'low' | 'medium' | 'high'
      businessImpact: 'medium' | 'high' | 'critical'
      targetSuccessors: number
      reviewCycleMonths: number
      nextReviewDate: string
      ownerEmployeeId?: string | null
      status: SuccessionPlanStatus
      notes?: string | null
      tenant?: SuccessionReference
      position?: SuccessionReference
      owner?: SuccessionReference | null
      activeCandidateCount?: number
      readyNowCount?: number
      createTime?: string
      updateTime?: string
    }

    interface SuccessionCandidate {
      id?: string
      tenantId?: string
      planId: string
      employeeId: string
      readiness: SuccessionReadiness
      potentialLevel: 'emerging' | 'medium' | 'high'
      retentionRisk: 'low' | 'medium' | 'high'
      priority: number
      nominationSource: 'talent_review' | 'manager' | 'hr' | 'self' | 'external_assessment'
      aspirationConfirmed: boolean
      mobilityScope?: string | null
      strengths?: string | null
      developmentGaps?: string | null
      reviewComment?: string | null
      status: SuccessionCandidateStatus
      nominatedOn: string
      lastReviewedOn?: string | null
      plan?: SuccessionReference
      employee?: SuccessionReference
      openActionCount?: number
      createTime?: string
      updateTime?: string
    }

    interface SuccessionDevelopmentAction {
      id?: string
      tenantId?: string
      candidateId: string
      actionType:
        | 'mentoring'
        | 'training'
        | 'stretch_assignment'
        | 'job_rotation'
        | 'coaching'
        | 'assessment'
        | 'other'
      actionTitle: string
      actionDescription?: string | null
      ownerEmployeeId?: string | null
      startDate: string
      dueDate: string
      status: SuccessionActionStatus
      completionDate?: string | null
      outcome?: string | null
      candidate?: SuccessionReference
      owner?: SuccessionReference | null
      createTime?: string
      updateTime?: string
    }

    type SuccessionRecord = SuccessionPlan | SuccessionCandidate | SuccessionDevelopmentAction

    interface SuccessionOverview {
      activePlanCount: number
      criticalPositionCount: number
      readyNowCount: number
      uncoveredPlanCount: number
      overdueActionCount: number
      dueReviewCount: number
    }

    interface SuccessionListResult<TRecord extends SuccessionRecord = SuccessionRecord> {
      records: TRecord[]
      total: number
    }

    interface SuccessionSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      status?: string
      tenantId?: string
      from?: number
      to?: number
    }

    interface TalentInventoryRecord {
      id: string
      employeeNo: string
      employeeName: string
      jobTitle?: string | null
      organizationName?: string | null
      positionName?: string | null
      performanceLevel?: string | null
      totalScore?: number | null
      cycleName?: string | null
      competencyTotal: number
      competencyMet: number
      competencyGapCount: number
      readinessRate?: number | null
    }

    interface TalentInventoryOverview {
      generatedAt: string
      totalRecords: number
      returnedRecords: number
      truncated: boolean
      employeeCount: number
      assessedCount: number
      highPerformerCount: number
      gapEmployeeCount: number
      averageReadinessRate?: number
      records: TalentInventoryRecord[]
    }

    interface SkillMatrixEmployee {
      id: string
      employeeNo: string
      employeeName: string
      jobTitle?: string | null
      organizationName?: string | null
      positionName?: string | null
      requiredCount: number
      assessedCount: number
      metCount: number
      gapCount: number
      unassessedCount: number
      readinessRate?: number | null
    }

    interface SkillMatrixCompetency {
      id: string
      competencyCode: string
      competencyName: string
      category: string
      requiredEmployees: number
      assessedEmployees: number
      metEmployees: number
      gapEmployees: number
      unassessedEmployees: number
      readinessRate?: number | null
      averageWeight?: number | null
    }

    interface SkillMatrixOverview {
      generatedAt: string
      totalRecords: number
      returnedRecords: number
      truncated: boolean
      employeeCount: number
      modelledEmployeeCount: number
      assessedEmployeeCount: number
      readyEmployeeCount: number
      gapEmployeeCount: number
      unassessedEmployeeCount: number
      records: SkillMatrixEmployee[]
      competencies: SkillMatrixCompetency[]
    }

    interface PeopleAnalyticsSummary {
      openingHeadcount: number
      endingHeadcount: number
      endingFte: number
      hires: number
      exits: number
      netChange: number
      turnoverRate: number
      averageTenureYears: number
      dataCompletenessRate: number
    }

    interface PeopleAnalyticsFlowPoint {
      month: string
      headcount: number
      hires: number
      exits: number
    }

    interface PeopleAnalyticsOrganizationCohort {
      name: string
      headcount: number
      fte: number
      share: number
      protected: boolean
    }

    interface PeopleAnalyticsEmploymentCohort {
      key: string
      headcount: number
      share: number
      protected: boolean
    }

    interface PeopleAnalyticsTenureCohort {
      key: string
      label: string
      headcount: number
      share: number
    }

    interface PeopleAnalyticsDataQualityItem {
      key: string
      label: string
      completeCount: number
      totalCount: number
      rate: number
    }

    interface PeopleAnalyticsOverview {
      asOfDate: string
      periodStartDate: string
      periodMonths: number
      privacyThreshold: number
      generatedAt: string
      overview: PeopleAnalyticsSummary
      flowTrend: PeopleAnalyticsFlowPoint[]
      organizationDistribution: PeopleAnalyticsOrganizationCohort[]
      employmentDistribution: PeopleAnalyticsEmploymentCohort[]
      tenureDistribution: PeopleAnalyticsTenureCohort[]
      dataQuality: PeopleAnalyticsDataQualityItem[]
    }
  }
}
