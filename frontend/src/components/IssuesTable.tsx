import React, { useMemo, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Button } from '@mui/material';
import { JiraIssue } from '../types/types';
import { FixModal } from './FixModal';

type Props = {
    issues: JiraIssue[],
    reload: () => void,
    projectKey: string | undefined,
    loading?: boolean
};

export const IssuesTable: React.FC<Props> = ({ issues, reload, projectKey, loading }) => {
    const [openModal, setOpenModal] = useState(false);
    const [activeIssueKey, setActiveIssueKey] = useState<string | undefined>(undefined);
    const [fixMode, setFixMode] = useState<'assign' | 'priority'>('assign');

    type IssueRow = JiraIssue & { id: string };

    const rows: IssueRow[] = useMemo(
        () => issues.map(i => ({ ...i, id: i.id })),
        [issues]
    );

    const columns: GridColDef[] = [
        { field: 'key', headerName: 'Key', width: 140 },
        { field: 'summary', headerName: 'Summary', flex: 1, valueGetter: (p) => p.row.fields.summary },
        { field: 'status', headerName: 'Status', width: 140, valueGetter: p => p.row.fields.status?.name || '' },
        {
            field: 'assignee',
            headerName: 'Assignee',
            width: 220,
            valueGetter: p => p.row.fields.assignee?.displayName || 'Unassigned'
        },
        { field: 'priority', headerName: 'Priority', width: 140, valueGetter: p => p.row.fields.priority?.name || '' },
        {
            field: 'actions', headerName: 'Actions', width: 160, sortable: false, renderCell: (p) => {
                const issue: JiraIssue = p.row;
                const isUnassigned = !issue.fields.assignee;
                const isLowNearDue = (issue.fields.priority?.name === 'Low' || issue.fields.priority?.name === 'Lowest')
                    && issue.fields.duedate && (new Date(issue.fields.duedate).getTime() - Date.now()) < 3 * 24 * 3600 * 1000;

                const isProblem = isUnassigned || isLowNearDue;
                if (!isProblem) return null;

                // Определяем режим модалки
                const mode: 'assign' | 'priority' = isUnassigned ? 'assign' : 'priority';

                return (
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                            setActiveIssueKey(issue.key);
                            setFixMode(mode);
                            setOpenModal(true);
                        }}
                    >
                        Fix
                    </Button>
                );
            }
        }
    ];

    return (
        <div style={{ height: 700, width: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                loading={loading}
                getRowClassName={(params) => {
                    const assignee = params.row.fields.assignee;
                    const duedate = params.row.fields.duedate;
                    const priority = params.row.fields.priority?.name;
                    const daysLeft = duedate ? (new Date(duedate).getTime() - Date.now()) / (1000 * 60 * 60 * 24) : Infinity;
                    if (!assignee) return 'row-unassigned';
                    if ((priority === 'Low' || priority === 'Lowest') && daysLeft < 3) return 'row-low-near-due';
                    return '';
                }}
                initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                disableRowSelectionOnClick
            />

            <FixModal
                open={openModal}
                issueKey={activeIssueKey}
                projectKey={projectKey}
                mode={fixMode}
                onClose={() => setOpenModal(false)}
                onAssigned={() => reload()}
            />
        </div>
    );
};
