/**
 * DashboardFooter — status bar Stitch refactor.
 *
 * Substitui legacy `.status-footer` inline styles.
 */

import React from 'react';
import './dashboard.css';

const BUILD = '2.0.0';

export function DashboardFooter({ division, seasonWeek, seasonNumber }) {
    return (
        <div className="ef-dash-footer">
            <div className="ef-dash-footer-meta">
                <span><span className="ef-dash-footer-label">LIGA:</span>SÉRIE {['A','B','C','D'][division - 1]}</span>
                <span><span className="ef-dash-footer-label">RODADA:</span>{seasonWeek}/38</span>
                <span><span className="ef-dash-footer-label">TEMP:</span>{seasonNumber}</span>
            </div>
            <div className="ef-dash-footer-build">OLÉ FUT {BUILD} SNES</div>
        </div>
    );
}

export default DashboardFooter;
