import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Database, UploadCloud, Download, AlertTriangle, RefreshCw } from 'lucide-react';
import { API_URL, restoreDatabase } from '../services/api';

const SettingsPage: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [restoreStatus, setRestoreStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

    const handleBackup = () => {
        // Direct browser download prompt triggering exactly the raw standard sqlite backend backup functionality
        window.location.href = `${API_URL}/settings/backup`;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            setRestoreStatus({ type: '', message: '' });
        }
    };

    const handleRestore = async () => {
        if (!selectedFile) return;

        // Add a layer of robust confirmation simply because this overrides current data state permanently
        if (!window.confirm("WARNING: Restoring a database file will permanently replace ALL current POS data (products, sales, users) with the uploaded backup. Are you absolutely sure?")) {
            return;
        }

        try {
            setIsRestoring(true);
            const response = await restoreDatabase(selectedFile);
            setRestoreStatus({ type: 'success', message: response.message });

            // Allow the UI 2 seconds to show the success message before auto-reloading
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error: any) {
            setRestoreStatus({
                type: 'error',
                message: error.response?.data?.error || 'Failed to successfully upload and restore database array.'
            });
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl animate-in fade-in duration-500 pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                    <Database className="w-8 h-8 text-indigo-500" />
                    System Settings
                </h1>
                <p className="text-slate-500 mt-1">Manage POS configuration, backups, and store data management.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Backup Settings Card */}
                <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl text-slate-800">
                            <Download className="w-5 h-5 text-indigo-500" />
                            Database Backup
                        </CardTitle>
                        <CardDescription>
                            Create a secure local copy of all POS data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-500 mb-6">
                            This safely extracts the exact state of your products, categories, historical sales, admin users, and active credit ledgers. Store this file securely.
                        </p>
                        <Button onClick={handleBackup} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-md shadow-sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download Backup (.sqlite)
                        </Button>
                    </CardContent>
                </Card>

                {/* Restore Settings Card */}
                <Card className="border-red-100 shadow-md bg-white border border-slate-100">
                    <CardHeader className="bg-red-50/50 rounded-t-xl border-b border-red-50">
                        <CardTitle className="flex items-center gap-2 text-xl text-red-700">
                            <UploadCloud className="w-5 h-5" />
                            Database Restore
                        </CardTitle>
                        <CardDescription className="text-red-500/80">
                            Danger Zone - Overwrite existing dataset
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-6 flex items-start gap-3 text-amber-800 text-sm">
                            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
                            <p>Loading a previous backup will permanently substitute the current data layout of the POS system. Unbacked changes will be lost.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        {selectedFile ? (
                                            <p className="font-semibold text-slate-700">{selectedFile.name}</p>
                                        ) : (
                                            <p className="text-sm text-slate-500"><span className="font-semibold text-indigo-600">Click to upload</span> backup (.sqlite)</p>
                                        )}
                                    </div>
                                    <input type="file" className="hidden" accept=".sqlite,.db" onChange={handleFileChange} />
                                </label>
                            </div>

                            {restoreStatus.message && (
                                <div className={`p-3 rounded-lg text-sm text-center font-medium ${restoreStatus.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                                    {restoreStatus.message}
                                </div>
                            )}

                            <Button
                                disabled={!selectedFile || isRestoring}
                                onClick={handleRestore}
                                variant="destructive"
                                className="w-full h-12 text-md shadow-sm"
                            >
                                {isRestoring ? (
                                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Restoring...</>
                                ) : (
                                    <><AlertTriangle className="w-4 h-4 mr-2" /> Upload & Restore Database</>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SettingsPage;
