import React, { useMemo, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Button } from '@mui/material';
import { JiraIssue } from '../store/useIssuesStore';
import { FixModal } from './FixModal';

type Props = {
    issues: JiraIssue[];
    reload: () => void;
    projectKey: string | undefined;
};

export const IssuesTable: React.FC<Props> = ({ issues, reload, projectKey }) => {
    const [openModal, setOpenModal] = useState(false);
    const [activeIssueKey, setActiveIssueKey] = useState<string | undefined>(undefined);

    type IssueRow = JiraIssue & { id: string };

    const rows: IssueRow[] = useMemo(
        () => issues.map(i => ({ ...i, id: i.id })),
        [issues]
    );


    const columns: GridColDef[] = [
        { field: 'key', headerName: 'Key', width: 140 },
        { field: 'summary', headerName: 'Summary', flex: 1, valueGetter: (p) => p.row.fields.summary },
        { field: 'status', headerName: 'Status', width: 140, valueGetter: p => p.row.fields.status?.name || '' },
        { field: 'assignee', headerName: 'Assignee', width: 220, valueGetter: p => p.row.fields.assignee?.displayName || 'Unassigned' },
        { field: 'priority', headerName: 'Priority', width: 140, valueGetter: p => p.row.fields.priority?.name || '' },
        { field: 'actions', headerName: 'Actions', width: 160, sortable: false, renderCell: (p) => {
                const issue: JiraIssue = p.row;
                const isUnassigned = !issue.fields.assignee;
                const isLowNearDue = issue.fields.priority?.name === 'Low' && issue.fields.duedate && (new Date(issue.fields.duedate).getTime() - Date.now()) < 3*24*3600*1000;
                const isProblem = isUnassigned || isLowNearDue;
                return isProblem ? <Button variant="contained" size="small" onClick={() => { setActiveIssueKey(issue.key); setOpenModal(true); }}>Fix</Button> : null;
            }
        }
    ];

    return (
        <div style={{ height: 700, width: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                getRowClassName={(params) => {
                    const assignee = params.row.fields.assignee;
                    const duedate = params.row.fields.duedate;
                    const priority = params.row.fields.priority?.name;
                    const daysLeft = duedate ? (new Date(duedate).getTime() - Date.now())/(1000*60*60*24) : Infinity;
                    if (!assignee) return 'row-unassigned';
                    if (priority === 'Low' && daysLeft < 3) return 'row-low-near-due';
                    return '';
                }}
                initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                disableRowSelectionOnClick
            />

            <FixModal
                open={openModal}
                issueKey={activeIssueKey}
                projectKey={projectKey}
                onClose={() => setOpenModal(false)}
                onAssigned={() => reload()}
            />
        </div>
    );
};
