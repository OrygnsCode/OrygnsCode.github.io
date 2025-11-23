export const mockData = {
    user: {
        id: 'u1',
        name: 'Alex Morgan',
        email: 'alex.morgan@techcorp.com',
        role: 'Product Manager',
        company: 'TechCorp',
        avatar: 'AM',
        timezone: 'America/Los_Angeles',
        lastLogin: new Date().toISOString(),
        preferences: {
            emailNotifications: true,
            projectUpdates: true,
            billingAlerts: true
        }
    },
    projects: [
        {
            id: 'p1',
            title: 'Website Redesign',
            client: 'Acme Corp',
            status: 'In Progress',
            dueDate: '2025-12-15',
            budget: 15000,
            progress: 65,
            description: 'Complete overhaul of the corporate website with new branding and CMS integration.',
            team: [
                { name: 'Sarah L.', role: 'Designer', avatar: 'SL' },
                { name: 'Mike R.', role: 'Developer', avatar: 'MR' }
            ],
            milestones: [
                { title: 'Design Phase', status: 'Completed', date: '2025-10-01' },
                { title: 'Frontend Dev', status: 'In Progress', date: '2025-11-15' },
                { title: 'Backend Dev', status: 'Pending', date: '2025-12-01' }
            ],
            tasks: [
                { id: 't1', title: 'Finalize Homepage Mockup', status: 'Completed', priority: 'High', assignee: 'Sarah L.' },
                { id: 't2', title: 'Implement Responsive Grid', status: 'In Progress', priority: 'High', assignee: 'Mike R.' },
                { id: 't3', title: 'Setup CMS Content Types', status: 'Pending', priority: 'Medium', assignee: 'Mike R.' }
            ]
        },
        {
            id: 'p2',
            title: 'Mobile App MVP',
            client: 'Globex Inc',
            status: 'Planning',
            dueDate: '2026-02-28',
            budget: 45000,
            progress: 15,
            description: 'MVP development for the new customer loyalty mobile application.',
            team: [
                { name: 'Alex M.', role: 'PM', avatar: 'AM' },
                { name: 'Jen K.', role: 'iOS Dev', avatar: 'JK' }
            ],
            milestones: [
                { title: 'Requirements Gathering', status: 'Completed', date: '2025-11-01' },
                { title: 'Wireframing', status: 'In Progress', date: '2025-11-30' },
                { title: 'Alpha Release', status: 'Pending', date: '2026-01-15' }
            ],
            tasks: [
                { id: 't4', title: 'User Flow Diagram', status: 'Completed', priority: 'High', assignee: 'Alex M.' },
                { id: 't5', title: 'Setup React Native Repo', status: 'In Progress', priority: 'High', assignee: 'Jen K.' }
            ]
        },
        {
            id: 'p3',
            title: 'SEO Optimization',
            client: 'Stark Ind',
            status: 'Completed',
            dueDate: '2025-10-30',
            budget: 5000,
            progress: 100,
            description: 'Technical SEO audit and optimization for the main marketing site.',
            team: [
                { name: 'Tom H.', role: 'SEO Specialist', avatar: 'TH' }
            ],
            milestones: [
                { title: 'Audit', status: 'Completed', date: '2025-10-01' },
                { title: 'Implementation', status: 'Completed', date: '2025-10-20' }
            ],
            tasks: []
        },
        {
            id: 'p4',
            title: 'Cloud Migration',
            client: 'Umbrella Corp',
            status: 'On Hold',
            dueDate: '2026-03-15',
            budget: 80000,
            progress: 30,
            description: 'Migrating legacy on-premise infrastructure to AWS.',
            team: [
                { name: 'David B.', role: 'DevOps', avatar: 'DB' }
            ],
            milestones: [],
            tasks: []
        },
        {
            id: 'p5',
            title: 'E-commerce Integration',
            client: 'Cyberdyne',
            status: 'In Progress',
            dueDate: '2025-12-31',
            budget: 25000,
            progress: 45,
            description: 'Integrating Stripe and Shopify for the new store.',
            team: [],
            milestones: [],
            tasks: []
        },
        {
            id: 'p6',
            title: 'Internal Dashboard',
            client: 'TechCorp',
            status: 'In Progress',
            dueDate: '2026-01-20',
            budget: 12000,
            progress: 55,
            description: 'Building an internal tool for tracking employee metrics.',
            team: [],
            milestones: [],
            tasks: []
        },
        {
            id: 'p7',
            title: 'Marketing Campaign',
            client: 'Acme Corp',
            status: 'Planning',
            dueDate: '2026-04-01',
            budget: 10000,
            progress: 0,
            description: 'Q1 2026 Marketing strategy and asset creation.',
            team: [],
            milestones: [],
            tasks: []
        },
        {
            id: 'p8',
            title: 'Security Audit',
            client: 'Globex Inc',
            status: 'Completed',
            dueDate: '2025-09-15',
            budget: 8000,
            progress: 100,
            description: 'Annual security penetration testing.',
            team: [],
            milestones: [],
            tasks: []
        }
    ],
    messages: [
        {
            id: 'm1',
            subject: 'Re: Homepage Design Feedback',
            participants: ['Sarah L.', 'Me'],
            lastMessage: 'I have updated the mockups based on your comments. Let me know what you think.',
            date: '2025-11-20T09:30:00',
            read: false,
            thread: [
                { id: 'msg1', sender: 'Me', text: 'Can we make the hero section larger?', time: '2025-11-19T14:00:00', isMe: true, avatar: 'AM' },
                { id: 'msg2', sender: 'Sarah L.', text: 'Sure, I will adjust that.', time: '2025-11-19T15:30:00', isMe: false, avatar: 'SL' },
                { id: 'msg3', sender: 'Sarah L.', text: 'I have updated the mockups based on your comments. Let me know what you think.', time: '2025-11-20T09:30:00', isMe: false, avatar: 'SL' }
            ]
        },
        {
            id: 'm2',
            subject: 'Project Kickoff: Mobile App',
            participants: ['Jen K.', 'Alex M.', 'Me'],
            lastMessage: 'Meeting scheduled for next Tuesday.',
            date: '2025-11-18T11:00:00',
            read: true,
            thread: [
                { id: 'msg4', sender: 'Jen K.', text: 'When are we starting?', time: '2025-11-18T10:00:00', isMe: false, avatar: 'JK' },
                { id: 'msg5', sender: 'Me', text: 'Meeting scheduled for next Tuesday.', time: '2025-11-18T11:00:00', isMe: true, avatar: 'AM' }
            ]
        },
        {
            id: 'm3',
            subject: 'Invoice #1023 Question',
            participants: ['Billing Dept', 'Me'],
            lastMessage: 'Thanks for clarifying.',
            date: '2025-11-15T16:45:00',
            read: true,
            thread: []
        },
        {
            id: 'm4',
            subject: 'Server Access',
            participants: ['David B.', 'Me'],
            lastMessage: 'Credentials sent via secure channel.',
            date: '2025-11-14T09:15:00',
            read: true,
            thread: []
        },
        {
            id: 'm5',
            subject: 'New Requirements',
            participants: ['Client X', 'Me'],
            lastMessage: 'Please review the attached doc.',
            date: '2025-11-10T13:20:00',
            read: true,
            thread: []
        }
    ],
    files: [
        { id: 'f1', name: 'Homepage_Mockup_v2.fig', type: 'image', size: '4.2 MB', date: '2025-11-20', project: 'Website Redesign', tags: ['Design', 'Mockup'] },
        { id: 'f2', name: 'Project_Proposal.pdf', type: 'pdf', size: '1.5 MB', date: '2025-11-18', project: 'Mobile App MVP', tags: ['Contract'] },
        { id: 'f3', name: 'Q4_Financials.xlsx', type: 'xls', size: '250 KB', date: '2025-11-15', project: 'Internal', tags: ['Finance'] },
        { id: 'f4', name: 'Logo_Assets.zip', type: 'zip', size: '12 MB', date: '2025-11-10', project: 'Website Redesign', tags: ['Assets'] },
        { id: 'f5', name: 'API_Documentation.docx', type: 'doc', size: '800 KB', date: '2025-11-05', project: 'Mobile App MVP', tags: ['Docs'] },
        { id: 'f6', name: 'Site_Audit_Report.pdf', type: 'pdf', size: '3.1 MB', date: '2025-10-25', project: 'SEO Optimization', tags: ['Report'] },
        { id: 'f7', name: 'Migration_Plan.pptx', type: 'doc', size: '5.5 MB', date: '2025-10-15', project: 'Cloud Migration', tags: ['Planning'] },
        { id: 'f8', name: 'main.js', type: 'code', size: '45 KB', date: '2025-11-19', project: 'Website Redesign', tags: ['Code'] },
        { id: 'f9', name: 'styles.css', type: 'code', size: '12 KB', date: '2025-11-19', project: 'Website Redesign', tags: ['Code'] },
        { id: 'f10', name: 'Meeting_Notes.txt', type: 'doc', size: '2 KB', date: '2025-11-18', project: 'Mobile App MVP', tags: ['Notes'] }
    ],
    invoices: [
        { id: 'INV-1024', date: '2025-11-01', dueDate: '2025-11-15', amount: 4500.00, status: 'Unpaid', client: 'Acme Corp', items: [{ desc: 'Design Services', amount: 4500 }] },
        { id: 'INV-1025', date: '2025-11-05', dueDate: '2025-11-20', amount: 2100.00, status: 'Unpaid', client: 'Globex Inc', items: [{ desc: 'Consulting', amount: 2100 }] },
        { id: 'INV-1023', date: '2025-10-15', dueDate: '2025-10-30', amount: 1250.00, status: 'Paid', paidDate: '2025-10-28', client: 'Stark Ind', items: [{ desc: 'SEO Audit', amount: 1250 }] },
        { id: 'INV-1022', date: '2025-10-01', dueDate: '2025-10-15', amount: 8000.00, status: 'Paid', paidDate: '2025-10-14', client: 'Umbrella Corp', items: [{ desc: 'Cloud Setup', amount: 8000 }] },
        { id: 'INV-1021', date: '2025-09-15', dueDate: '2025-09-30', amount: 3000.00, status: 'Overdue', client: 'Cyberdyne', items: [{ desc: 'Integration', amount: 3000 }] }
    ],
    activity: [
        { id: 'a1', text: 'Sarah L. uploaded "Homepage_Mockup_v2.fig"', time: '2 hours ago', type: 'file', icon: 'fa-file-image' },
        { id: 'a2', text: 'New message from Sarah L. in "Re: Homepage Design Feedback"', time: '4 hours ago', type: 'message', icon: 'fa-envelope' },
        { id: 'a3', text: 'Invoice #1023 marked as Paid', time: '2 days ago', type: 'billing', icon: 'fa-file-invoice-dollar' },
        { id: 'a4', text: 'Project "SEO Optimization" marked as Completed', time: '1 week ago', type: 'project', icon: 'fa-check-circle' },
        { id: 'a5', text: 'Mike R. completed task "Finalize Homepage Mockup"', time: '1 week ago', type: 'task', icon: 'fa-list-check' },
        { id: 'a6', text: 'System update: Security patch applied', time: '2 weeks ago', type: 'settings', icon: 'fa-shield-halved' }
    ],
    notifications: [
        { id: 'n1', text: 'New message from Sarah L.', read: false, time: '4 hours ago', link: '#/messages/m1' },
        { id: 'n2', text: 'Invoice #1025 is due soon', read: false, time: '1 day ago', link: '#/billing' },
        { id: 'n3', text: 'Project "Mobile App MVP" moved to Planning', read: true, time: '3 days ago', link: '#/projects/p2' }
    ]
};
