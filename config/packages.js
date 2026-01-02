// Central package definitions used by credits + payments + admin approvals
// NOTE: We reuse `freePlayers` as "team players allowed" for the team-management module.
module.exports.PACKAGES = {
  starter: { credits: 14, freePlayers: 5, price: 4.99 },
  medium: { credits: 35, freePlayers: 10, price: 9.99 },
  premium: { credits: 80, freePlayers: 20, price: 19.99 }
};


