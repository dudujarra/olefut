/* eslint-disable no-unused-vars */
/**
 * DashboardAlerts — alert strip Stitch refactor.
 */

import React from 'react';
import './dashboard.css';

export function DashboardAlerts({ injured, expiringContracts, avgEnergy, transferOffersCount, onOpenTransfers }) {
    const hasAlerts = injured.length > 0 || expiringContracts.length > 0 || avgEnergy < 50 || transferOffersCount > 0;
    if (!hasAlerts) return null;

    return (
        <div className="ef-dash-alerts">
            {injured.length > 0 && (
                <span className="ef-dash-alert ef-dash-alert-danger">
                    🏥 {injured.length} lesionado{injured.length > 1 ? 's' : ''}
                </span>
            )}
            {expiringContracts.length > 0 && (
                <span className="ef-dash-alert ef-dash-alert-warning">
                    📋 {expiringContracts.length} contrato{expiringContracts.length > 1 ? 's' : ''} vencendo
                </span>
            )}
            {avgEnergy < 50 && (
                <span className="ef-dash-alert ef-dash-alert-danger">
                    ⚡ Elenco cansado ({avgEnergy.toFixed(0)}%)
                </span>
            )}
            {transferOffersCount > 0 && (
                <span className="ef-dash-alert ef-dash-alert-info" onClick={onOpenTransfers}>
                    📬 {transferOffersCount} oferta{transferOffersCount > 1 ? 's' : ''}
                </span>
            )}
        </div>
    );
}

export default DashboardAlerts;
