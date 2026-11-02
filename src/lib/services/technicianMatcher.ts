import { Technician, Customer, ServiceType } from '@/types';

export interface TechnicianMatchResult {
  technician: Technician;
  score: number;
  matchReasons: string[];
  distanceEstimateKm: number;
  isRecommended: boolean;
}

export function matchTechniciansForService(
  technicians: Technician[],
  customer: Customer,
  serviceType: ServiceType
): TechnicianMatchResult[] {
  const customerArea = (customer.areaLocality || '').toLowerCase().trim();

  const results: TechnicianMatchResult[] = technicians
    .filter((t) => t.status !== 'On leave' && t.status !== 'Inactive')
    .map((tech) => {
      let score = 50; // base score
      const matchReasons: string[] = [];
      let distanceKm = 8; // default estimate

      // 1. Locality coverage match
      const servesArea = tech.serviceAreas.some((area) =>
        customerArea.includes(area.toLowerCase()) || area.toLowerCase().includes(customerArea)
      );
      if (servesArea) {
        score += 35;
        distanceKm = 2.5;
        matchReasons.push(`Primary service zone: ${customer.areaLocality}`);
      } else {
        distanceKm = 10.5;
      }

      // 2. Skill match
      const isCommercial = serviceType === 'Installation' || customer.customerType === 'Commercial';
      if (isCommercial) {
        if (tech.skills.includes('Commercial RO')) {
          score += 20;
          matchReasons.push('Commercial RO certified');
        }
      } else {
        if (tech.skills.includes('Domestic RO')) {
          score += 10;
          matchReasons.push('Domestic RO specialist');
        }
      }

      if (serviceType === 'Pump replacement' && tech.skills.includes('Pump Repair')) {
        score += 15;
        matchReasons.push('Booster pump diagnostic expert');
      }

      // 3. Workload balancing
      if (tech.pendingJobs <= 2) {
        score += 15;
        matchReasons.push(`Light workload today (${tech.pendingJobs} active jobs)`);
      } else if (tech.pendingJobs >= 5) {
        score -= 20;
        matchReasons.push(`High workload (${tech.pendingJobs} active jobs)`);
      }

      return {
        technician: tech,
        score: Math.max(10, Math.min(100, score)),
        matchReasons,
        distanceEstimateKm: distanceKm,
        isRecommended: false,
      };
    });

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);

  if (results.length > 0) {
    results[0].isRecommended = true;
  }

  return results;
}
