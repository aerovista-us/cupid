/**
 * Cupid — Relationship State Machine
 * Manages relationship mode transitions based on stats.
 */

export class RelationshipManager {
  /**
   * Check if relationship should transition based on current stats.
   * Returns new mode if transition should occur, null otherwise.
   */
  checkTransitions(state) {
    const stats = state.stats || {};
    const currentMode = state.rel?.mode || 'strangers';
    const trust = stats.trust || 0;
    const attraction = stats.attraction || 0;
    const resentment = stats.resentment || 0;
    const chaos = stats.chaos || 0;

    // Transition rules
    switch (currentMode) {
      case 'strangers':
        if (trust > 3 && attraction > 2) return 'friends';
        if (resentment > 6) return 'enemies';
        break;
      
      case 'friends':
        if (attraction > 7 && trust > 5) return 'lovers';
        if (resentment > 8) return 'enemies';
        if (trust < 2 && attraction < 2) return 'strangers';
        break;
      
      case 'lovers':
        if (resentment > 8) return 'enemies';
        if (trust < 3 || attraction < 4) return 'friends';
        if (trust > 8 && attraction > 8 && resentment < 2) return 'soulmates';
        break;
      
      case 'enemies':
        if (trust > 6 && resentment < 3) return 'friends';
        if (attraction > 7 && chaos > 6) return 'lovers'; // enemies-to-lovers arc
        break;
      
      case 'soulmates':
        if (resentment > 6) return 'lovers';
        break;
      
      default:
        break;
    }
    return null;
  }

  /**
   * Get relationship intensity based on stats (0-100).
   */
  calculateIntensity(state) {
    const stats = state.stats || {};
    const trust = Math.max(0, Math.min(10, stats.trust || 0));
    const attraction = Math.max(0, Math.min(10, stats.attraction || 0));
    const resentment = Math.max(0, Math.min(10, stats.resentment || 0));
    
    // Base intensity from trust + attraction, reduced by resentment
    const base = (trust + attraction) * 5; // 0-100 scale
    const penalty = resentment * 3;
    return Math.max(0, Math.min(100, base - penalty));
  }

  /**
   * Get transition hint text for current state.
   */
  getTransitionHint(state) {
    const stats = state.stats || {};
    const currentMode = state.rel?.mode || 'strangers';
    const trust = stats.trust || 0;
    const attraction = stats.attraction || 0;
    const resentment = stats.resentment || 0;

    switch (currentMode) {
      case 'strangers':
        if (trust < 3) return 'Build trust to become friends';
        if (attraction < 2) return 'Create attraction to move forward';
        return 'Almost friends...';
      
      case 'friends':
        if (attraction < 7) return 'Deepen attraction to become lovers';
        if (trust < 5) return 'Build trust for a deeper connection';
        return 'Ready for something more...';
      
      case 'lovers':
        if (resentment > 6) return 'Resentment is building...';
        if (trust < 3) return 'Trust is fading...';
        return 'Strong bond';
      
      case 'enemies':
        if (trust < 6) return 'Rebuild trust to reconcile';
        if (resentment > 3) return 'Let go of resentment';
        return 'Path to reconciliation...';
      
      default:
        return '';
    }
  }
}
