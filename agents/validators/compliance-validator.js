#!/usr/bin/env node

class ComplianceValidator {
    constructor() {
        this.agentId = 'compliance-validator';
        this.state = 'IDLE';
        
        // SEBI prohibited terms and phrases
        this.prohibitedTerms = [
            'guaranteed returns',
            'assured returns',
            'fixed returns',
            'risk-free',
            'no risk',
            'guaranteed profit',
            'sure shot',
            'definite returns',
            'confirmed gains',
            'zero loss',
            'safe investment',
            'guaranteed income',
            'assured profit',
            'guaranteed growth',
            'no loss guarantee',
            'principal protection guarantee',
            'capital guarantee'
        ];
        
        // Required disclaimers and elements
        this.requiredElements = {
            arn: {
                pattern: /ARN[-\s]?\d{4,6}/i,
                message: 'ARN (AMFI Registration Number) must be present'
            },
            riskStatement: {
                keywords: ['risk', 'market risk', 'market-linked', 'fluctuation', 'volatility'],
                message: 'Risk disclosure statement is required'
            },
            disclaimer: {
                keywords: ['past performance', 'not indicative', 'future returns', 'mutual fund investments'],
                message: 'Standard mutual fund disclaimer is required'
            },
            schemeDocs: {
                keywords: ['scheme document', 'offer document', 'SID', 'SAI', 'KIM'],
                message: 'Reference to scheme documents is recommended'
            }
        };
        
        // SEBI mandated disclaimers
        this.mandatoryDisclaimers = [
            'Mutual Fund investments are subject to market risks',
            'Read all scheme related documents carefully',
            'Past performance is not indicative of future returns'
        ];
    }

    async initialize() {
        try {
            this.state = 'PROCESSING';
            
            const Communication = require('../utils/communication');
            const ErrorHandler = require('../utils/error-handler');
            const Logger = require('../utils/logger');
            
            this.communication = new Communication();
            this.errorHandler = new ErrorHandler();
            this.logger = new Logger(this.agentId);
            
            this.logger.info('Compliance Validator initialized');
            this.state = 'IDLE';
            return true;
        } catch (error) {
            this.state = 'ERROR';
            console.error('Failed to initialize compliance validator:', error);
            return false;
        }
    }

    validateContent(content, advisorArn) {
        try {
            this.state = 'PROCESSING';
            this.logger.info('Validating content for compliance', { advisorArn });
            
            const violations = [];
            const warnings = [];
            const recommendations = [];
            
            // Check for prohibited terms
            const prohibitedFound = this.checkProhibitedTerms(content);
            violations.push(...prohibitedFound);
            
            // Check for required elements
            const missingElements = this.checkRequiredElements(content, advisorArn);
            violations.push(...missingElements.violations);
            warnings.push(...missingElements.warnings);
            
            // Check for mandatory disclaimers
            const missingDisclaimers = this.checkMandatoryDisclaimers(content);
            violations.push(...missingDisclaimers);
            
            // Generate recommendations
            recommendations.push(...this.generateRecommendations(content, violations));
            
            // Calculate compliance score
            const complianceScore = this.calculateComplianceScore(violations, warnings);
            
            // Generate audit trail
            const auditTrail = this.generateAuditTrail(advisorArn, content, violations, complianceScore);
            
            this.state = 'IDLE';
            
            return {
                complianceScore,
                violations,
                warnings,
                recommendations,
                auditTrail,
                isCompliant: violations.length === 0,
                requiresReview: violations.length > 0 || warnings.length > 2,
                validatedAt: new Date().toISOString()
            };
            
        } catch (error) {
            this.state = 'ERROR';
            this.logger.error('Content validation failed', error);
            throw error;
        }
    }

    checkProhibitedTerms(content) {
        const violations = [];
        const contentLower = content.toLowerCase();
        
        this.prohibitedTerms.forEach(term => {
            if (contentLower.includes(term.toLowerCase())) {
                violations.push({
                    type: 'PROHIBITED_TERM',
                    severity: 'HIGH',
                    term: term,
                    message: `Prohibited term "${term}" found. This violates SEBI guidelines.`,
                    remediation: `Remove or replace "${term}" with compliant language`
                });
            }
        });
        
        // Check for misleading percentages without proper context
        const percentagePattern = /\d+\.?\d*\s*%\s*(returns?|gains?|growth|profit)/gi;
        const percentageMatches = content.match(percentagePattern);
        
        if (percentageMatches) {
            percentageMatches.forEach(match => {
                if (!this.hasProperContext(content, match)) {
                    violations.push({
                        type: 'MISLEADING_RETURNS',
                        severity: 'MEDIUM',
                        term: match,
                        message: `Percentage returns "${match}" may be misleading without proper context`,
                        remediation: 'Add historical context and disclaimer for return figures'
                    });
                }
            });
        }
        
        // Check for promissory language
        const promissoryPatterns = [
            /will\s+(definitely|surely|certainly)\s+(give|provide|generate)/gi,
            /you\s+(will|can)\s+(earn|make|get)\s+\d+/gi,
            /promise\s+(you|to|that)/gi
        ];
        
        promissoryPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    violations.push({
                        type: 'PROMISSORY_LANGUAGE',
                        severity: 'HIGH',
                        term: match,
                        message: `Promissory language "${match}" is not permitted`,
                        remediation: 'Replace with factual, non-promissory language'
                    });
                });
            }
        });
        
        return violations;
    }

    checkRequiredElements(content, advisorArn) {
        const violations = [];
        const warnings = [];
        
        // Check for ARN
        if (!this.requiredElements.arn.pattern.test(content)) {
            // If ARN is provided separately, check if it matches
            if (advisorArn && !content.includes(advisorArn)) {
                violations.push({
                    type: 'MISSING_ARN',
                    severity: 'HIGH',
                    message: this.requiredElements.arn.message,
                    remediation: `Add ARN number: ${advisorArn}`
                });
            }
        }
        
        // Check for risk statement
        const hasRiskStatement = this.requiredElements.riskStatement.keywords.some(
            keyword => content.toLowerCase().includes(keyword)
        );
        
        if (!hasRiskStatement) {
            violations.push({
                type: 'MISSING_RISK_STATEMENT',
                severity: 'HIGH',
                message: this.requiredElements.riskStatement.message,
                remediation: 'Add risk disclosure: "Investments are subject to market risks"'
            });
        }
        
        // Check for disclaimer
        const hasDisclaimer = this.requiredElements.disclaimer.keywords.some(
            keyword => content.toLowerCase().includes(keyword)
        );
        
        if (!hasDisclaimer) {
            warnings.push({
                type: 'MISSING_DISCLAIMER',
                severity: 'MEDIUM',
                message: this.requiredElements.disclaimer.message,
                remediation: 'Add standard disclaimer about past performance'
            });
        }
        
        // Check for scheme document reference (warning only)
        const hasSchemeDocs = this.requiredElements.schemeDocs.keywords.some(
            keyword => content.toLowerCase().includes(keyword)
        );
        
        if (!hasSchemeDocs) {
            warnings.push({
                type: 'MISSING_SCHEME_DOCS',
                severity: 'LOW',
                message: this.requiredElements.schemeDocs.message,
                remediation: 'Consider adding reference to scheme documents'
            });
        }
        
        return { violations, warnings };
    }

    checkMandatoryDisclaimers(content) {
        const violations = [];
        const contentLower = content.toLowerCase();
        
        this.mandatoryDisclaimers.forEach(disclaimer => {
            const disclaimerKeywords = disclaimer.toLowerCase().split(' ')
                .filter(word => word.length > 3);
            
            const keywordMatches = disclaimerKeywords.filter(
                keyword => contentLower.includes(keyword)
            ).length;
            
            const matchPercentage = keywordMatches / disclaimerKeywords.length;
            
            if (matchPercentage < 0.6) {
                violations.push({
                    type: 'MISSING_MANDATORY_DISCLAIMER',
                    severity: 'HIGH',
                    message: `Mandatory disclaimer missing: "${disclaimer}"`,
                    remediation: `Add disclaimer: "${disclaimer}"`
                });
            }
        });
        
        return violations;
    }

    hasProperContext(content, returnStatement) {
        const contextKeywords = ['historical', 'past', 'previous', 'last year', 'last month', 
                                'disclaimer', 'not guaranteed', 'subject to', 'may vary'];
        
        // Check if context keywords appear within 50 characters of the return statement
        const index = content.toLowerCase().indexOf(returnStatement.toLowerCase());
        if (index === -1) return false;
        
        const contextWindow = content.substring(
            Math.max(0, index - 50),
            Math.min(content.length, index + returnStatement.length + 50)
        ).toLowerCase();
        
        return contextKeywords.some(keyword => contextWindow.includes(keyword));
    }

    calculateComplianceScore(violations, warnings) {
        let score = 1.0;
        
        // Deduct for violations
        violations.forEach(violation => {
            switch (violation.severity) {
                case 'HIGH':
                    score -= 0.3;
                    break;
                case 'MEDIUM':
                    score -= 0.15;
                    break;
                case 'LOW':
                    score -= 0.05;
                    break;
            }
        });
        
        // Deduct for warnings
        warnings.forEach(warning => {
            switch (warning.severity) {
                case 'MEDIUM':
                    score -= 0.05;
                    break;
                case 'LOW':
                    score -= 0.02;
                    break;
            }
        });
        
        return Math.max(0, Math.round(score * 100) / 100);
    }

    generateRecommendations(content, violations) {
        const recommendations = [];
        
        // Recommend adding disclaimers if missing
        if (violations.some(v => v.type === 'MISSING_MANDATORY_DISCLAIMER')) {
            recommendations.push({
                priority: 'HIGH',
                recommendation: 'Add all SEBI-mandated disclaimers at the end of the content',
                template: this.getDisclaimerTemplate()
            });
        }
        
        // Recommend tone adjustment if promissory language found
        if (violations.some(v => v.type === 'PROMISSORY_LANGUAGE')) {
            recommendations.push({
                priority: 'HIGH',
                recommendation: 'Adjust tone to be educational rather than promissory',
                example: 'Replace "You will earn" with "Historical returns have been"'
            });
        }
        
        // Recommend adding context for returns
        if (violations.some(v => v.type === 'MISLEADING_RETURNS')) {
            recommendations.push({
                priority: 'MEDIUM',
                recommendation: 'Add historical context and time periods for all return figures',
                example: 'Specify "Returns for the period Apr 2023 - Mar 2024"'
            });
        }
        
        // General best practices
        if (content.length < 200) {
            recommendations.push({
                priority: 'LOW',
                recommendation: 'Consider adding more educational content to provide value',
                example: 'Include market insights, investment principles, or fund categories'
            });
        }
        
        if (!content.toLowerCase().includes('consult') && !content.toLowerCase().includes('advisor')) {
            recommendations.push({
                priority: 'LOW',
                recommendation: 'Consider adding a note to consult with financial advisor',
                example: 'Add: "Please consult your financial advisor before making investment decisions"'
            });
        }
        
        return recommendations;
    }

    getDisclaimerTemplate() {
        return `
==== STANDARD DISCLAIMER ====
Mutual Fund investments are subject to market risks, read all scheme related documents carefully.

The past performance of mutual funds is not necessarily indicative of future performance of the schemes.

[Advisor Name] | ARN-[NUMBER]

Please consult your financial advisor before making any investment decisions.
=============================`;
    }

    generateAuditTrail(advisorArn, content, violations, complianceScore) {
        return {
            timestamp: new Date().toISOString(),
            advisorArn: advisorArn,
            contentHash: this.generateContentHash(content),
            complianceScore: complianceScore,
            violationCount: violations.length,
            violationTypes: [...new Set(violations.map(v => v.type))],
            validatorVersion: '1.0.0',
            auditId: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
    }

    generateContentHash(content) {
        // Simple hash for audit purposes
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    async generateComplianceReport(advisorArn, period = 30) {
        try {
            this.state = 'PROCESSING';
            this.logger.info(`Generating compliance report for advisor: ${advisorArn}`);
            
            // In production, this would fetch from database
            const mockValidations = this.getMockValidationHistory(advisorArn, period);
            
            const report = {
                advisorArn: advisorArn,
                period: period,
                totalValidations: mockValidations.length,
                averageComplianceScore: this.calculateAverageScore(mockValidations),
                commonViolations: this.identifyCommonViolations(mockValidations),
                complianceTrend: this.calculateComplianceTrend(mockValidations),
                recommendations: this.generateReportRecommendations(mockValidations),
                generatedAt: new Date().toISOString()
            };
            
            this.state = 'IDLE';
            this.logger.info('Compliance report generated successfully');
            
            return report;
            
        } catch (error) {
            this.state = 'ERROR';
            this.logger.error('Failed to generate compliance report', error);
            throw error;
        }
    }

    getMockValidationHistory(advisorArn, period) {
        const history = [];
        const now = new Date();
        
        for (let i = 0; i < 10; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - (i * 3));
            
            history.push({
                date: date.toISOString(),
                advisorArn: advisorArn,
                complianceScore: 0.7 + Math.random() * 0.3,
                violations: Math.floor(Math.random() * 3),
                violationTypes: ['MISSING_DISCLAIMER', 'PROHIBITED_TERM', 'MISSING_ARN']
                    .slice(0, Math.floor(Math.random() * 3))
            });
        }
        
        return history;
    }

    calculateAverageScore(validations) {
        if (validations.length === 0) return 0;
        const sum = validations.reduce((acc, val) => acc + val.complianceScore, 0);
        return Math.round((sum / validations.length) * 100) / 100;
    }

    identifyCommonViolations(validations) {
        const violationCounts = {};
        
        validations.forEach(val => {
            val.violationTypes.forEach(type => {
                violationCounts[type] = (violationCounts[type] || 0) + 1;
            });
        });
        
        return Object.entries(violationCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([type, count]) => ({ type, count, percentage: (count / validations.length) * 100 }));
    }

    calculateComplianceTrend(validations) {
        if (validations.length < 2) return 'STABLE';
        
        const recentScores = validations.slice(0, 3).map(v => v.complianceScore);
        const olderScores = validations.slice(-3).map(v => v.complianceScore);
        
        const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
        
        if (recentAvg > olderAvg + 0.1) return 'IMPROVING';
        if (recentAvg < olderAvg - 0.1) return 'DECLINING';
        return 'STABLE';
    }

    generateReportRecommendations(validations) {
        const recommendations = [];
        const avgScore = this.calculateAverageScore(validations);
        
        if (avgScore < 0.8) {
            recommendations.push('Implement pre-publication compliance review process');
        }
        
        const commonViolations = this.identifyCommonViolations(validations);
        if (commonViolations.some(v => v.type === 'MISSING_DISCLAIMER')) {
            recommendations.push('Create content templates with pre-filled disclaimers');
        }
        
        if (commonViolations.some(v => v.type === 'PROHIBITED_TERM')) {
            recommendations.push('Provide training on SEBI-compliant language');
        }
        
        return recommendations;
    }

    async processMessage(message) {
        try {
            if (!this.communication || !this.communication.validateMessage(message)) {
                throw new Error('Invalid message format');
            }
            
            const { action, payload } = message;
            
            switch (action) {
                case 'VALIDATE_CONTENT':
                    const validationResult = this.validateContent(
                        payload.content,
                        payload.advisorArn
                    );
                    
                    return this.communication.createMessage({
                        agentId: this.agentId,
                        action: 'VALIDATION_RESPONSE',
                        payload: validationResult,
                        context: message.context,
                        responseRequired: false
                    });
                
                case 'GENERATE_REPORT':
                    const report = await this.generateComplianceReport(
                        payload.advisorArn,
                        payload.period || 30
                    );
                    
                    return this.communication.createMessage({
                        agentId: this.agentId,
                        action: 'REPORT_RESPONSE',
                        payload: report,
                        context: message.context,
                        responseRequired: false
                    });
                
                case 'GET_GUIDELINES':
                    return this.communication.createMessage({
                        agentId: this.agentId,
                        action: 'GUIDELINES_RESPONSE',
                        payload: {
                            prohibitedTerms: this.prohibitedTerms,
                            requiredElements: Object.keys(this.requiredElements),
                            mandatoryDisclaimers: this.mandatoryDisclaimers,
                            template: this.getDisclaimerTemplate()
                        },
                        context: message.context,
                        responseRequired: false
                    });
                
                default:
                    throw new Error(`Unknown action: ${action}`);
            }
        } catch (error) {
            this.logger.error('Failed to process message', error);
            return this.communication.createMessage({
                agentId: this.agentId,
                action: 'ERROR_RESPONSE',
                payload: { error: error.message },
                context: message.context,
                responseRequired: false
            });
        }
    }

    async test() {
        console.log('=== Compliance Validator Test Mode ===');
        
        const initialized = await this.initialize();
        if (!initialized) {
            console.error('Failed to initialize compliance validator');
            return;
        }
        
        console.log('\n1. Testing with compliant content...');
        const compliantContent = `
            Understanding Mutual Fund Investments (ARN-12345)
            
            Mutual funds have historically provided returns ranging from 8-15% annually,
            though past performance is not indicative of future returns.
            
            Mutual Fund investments are subject to market risks, read all scheme related documents carefully.
        `;
        
        const compliantResult = this.validateContent(compliantContent, 'ARN-12345');
        console.log(`Compliance Score: ${compliantResult.complianceScore}`);
        console.log(`Is Compliant: ${compliantResult.isCompliant}`);
        console.log(`Violations: ${compliantResult.violations.length}`);
        
        console.log('\n2. Testing with non-compliant content...');
        const nonCompliantContent = `
            Guaranteed returns of 20% annually!
            
            This is a risk-free investment that will definitely make you rich.
            You will earn assured returns with no loss guarantee.
        `;
        
        const nonCompliantResult = this.validateContent(nonCompliantContent, 'ARN-12345');
        console.log(`Compliance Score: ${nonCompliantResult.complianceScore}`);
        console.log(`Is Compliant: ${nonCompliantResult.isCompliant}`);
        console.log(`Violations: ${nonCompliantResult.violations.length}`);
        console.log('Violation Types:');
        nonCompliantResult.violations.forEach(v => {
            console.log(`  - ${v.type}: ${v.message}`);
        });
        
        console.log('\n3. Testing recommendations generation...');
        if (nonCompliantResult.recommendations.length > 0) {
            console.log('Recommendations:');
            nonCompliantResult.recommendations.forEach(rec => {
                console.log(`  - [${rec.priority}] ${rec.recommendation}`);
            });
        }
        
        console.log('\n4. Testing compliance report generation...');
        const report = await this.generateComplianceReport('ARN-12345', 30);
        console.log(`Average Compliance Score: ${report.averageComplianceScore}`);
        console.log(`Compliance Trend: ${report.complianceTrend}`);
        console.log(`Total Validations: ${report.totalValidations}`);
        
        console.log('\n=== Test Complete ===');
    }
}

if (require.main === module) {
    const validator = new ComplianceValidator();
    
    const args = process.argv.slice(2);
    if (args.includes('--test')) {
        validator.test();
    } else {
        validator.initialize().then(() => {
            console.log('Compliance Validator running...');
        });
    }
}

module.exports = ComplianceValidator;