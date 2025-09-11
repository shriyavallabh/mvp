#!/usr/bin/env node

const ComplianceValidator = require('../../../../agents/validators/compliance-validator');

describe('ComplianceValidator', () => {
    let validator;

    beforeEach(() => {
        validator = new ComplianceValidator();
    });

    describe('constructor', () => {
        it('should initialize with correct prohibited terms', () => {
            expect(validator.agentId).toBe('compliance-validator');
            expect(validator.state).toBe('IDLE');
            expect(validator.prohibitedTerms).toContain('guaranteed returns');
            expect(validator.prohibitedTerms).toContain('risk-free');
            expect(validator.prohibitedTerms).toContain('assured returns');
        });

        it('should have required elements configured', () => {
            expect(validator.requiredElements.arn).toBeDefined();
            expect(validator.requiredElements.riskStatement).toBeDefined();
            expect(validator.requiredElements.disclaimer).toBeDefined();
        });
    });

    describe('validateContent', () => {
        beforeEach(async () => {
            await validator.initialize();
        });

        it('should pass valid content', () => {
            const validContent = `
                Investment opportunity for growth.
                ARN-12345
                Mutual Fund investments are subject to market risks.
                Past performance is not indicative of future returns.
                Please read all scheme related documents carefully.
            `;
            
            const result = validator.validateContent(validContent, 'ARN-12345');
            expect(result.isCompliant).toBe(true);
            expect(result.complianceScore).toBeGreaterThan(0.8);
            expect(result.violations).toHaveLength(0);
        });

        it('should detect prohibited terms', () => {
            const invalidContent = `
                Get guaranteed returns with our fund!
                ARN-12345
                This is a risk-free investment opportunity.
            `;
            
            const result = validator.validateContent(invalidContent, 'ARN-12345');
            expect(result.isCompliant).toBe(false);
            expect(result.violations).toContain('Contains prohibited term: guaranteed returns');
            expect(result.violations).toContain('Contains prohibited term: risk-free');
        });

        it('should detect missing ARN', () => {
            const contentWithoutARN = `
                Investment opportunity for growth.
                Mutual Fund investments are subject to market risks.
            `;
            
            const result = validator.validateContent(contentWithoutARN, 'ARN-12345');
            expect(result.isCompliant).toBe(false);
            expect(result.violations).toContain('ARN (AMFI Registration Number) must be present');
        });

        it('should detect missing risk statement', () => {
            const contentWithoutRisk = `
                Investment opportunity for growth.
                ARN-12345
                Past performance is not indicative of future returns.
            `;
            
            const result = validator.validateContent(contentWithoutRisk, 'ARN-12345');
            expect(result.isCompliant).toBe(false);
            expect(result.violations).toContain('Risk disclosure statement is required');
        });
    });

    describe('generateComplianceReport', () => {
        beforeEach(async () => {
            await validator.initialize();
        });

        it('should generate detailed compliance report', () => {
            const content = `
                Investment with guaranteed returns!
                ARN-12345
            `;
            
            const validation = validator.validateContent(content, 'ARN-12345');
            const report = validator.generateComplianceReport(validation, 'ARN-12345');
            
            expect(report).toContain('COMPLIANCE VALIDATION REPORT');
            expect(report).toContain('Advisor: ARN-12345');
            expect(report).toContain('Compliant: NO');
            expect(report).toContain('Violations Found:');
            expect(report).toContain('Recommendations:');
        });
    });

    describe('checkProhibitedTerms', () => {
        it('should detect all variations of prohibited terms', () => {
            const violations = validator.checkProhibitedTerms('Guaranteed Returns are assured');
            expect(violations).toHaveLength(1);
            expect(violations[0]).toContain('guaranteed returns');
        });

        it('should be case insensitive', () => {
            const violations = validator.checkProhibitedTerms('RISK-FREE investment');
            expect(violations).toHaveLength(1);
            expect(violations[0]).toContain('risk-free');
        });
    });

    describe('checkRequiredElements', () => {
        it('should validate ARN format', () => {
            const missing1 = validator.checkRequiredElements('No ARN here', 'ARN-12345');
            expect(missing1).toContain('ARN (AMFI Registration Number) must be present');

            const missing2 = validator.checkRequiredElements('ARN-12345 is here', 'ARN-12345');
            expect(missing2).not.toContain('ARN (AMFI Registration Number) must be present');
        });
    });

    describe('calculateComplianceScore', () => {
        it('should calculate score based on violations', () => {
            const score1 = validator.calculateComplianceScore(0, 0);
            expect(score1).toBe(1.0);

            const score2 = validator.calculateComplianceScore(2, 1);
            expect(score2).toBeLessThan(0.5);

            const score3 = validator.calculateComplianceScore(5, 3);
            expect(score3).toBe(0);
        });
    });
});

// Mock test runner if jest is not available
if (typeof describe === 'undefined') {
    console.log('Unit tests for ComplianceValidator defined successfully');
    console.log('Run with Jest or another test runner to execute tests');
}