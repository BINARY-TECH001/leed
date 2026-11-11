import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Badge, BottomSheet, ConfirmBottomSheet } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  ArrowLeft2,
  DocumentUpload,
  TickCircle,
  Add,
  Trash,
  Code,
  Briefcase,
  Eye,
  DocumentText,
  Star1,
  FolderOpen,
  Edit2,
  Building,
  Calendar,
  Location,
  ExportSquare,
  InfoCircle,
} from 'iconsax-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import {
  profileService,
  ProfileDocument,
  ProfileExperience,
  ProfileSkill,
} from '@/services/profileService';
import { toast } from 'sonner-native';

export default function CareerProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, updateUser } = useAuth();

  // Load real profile from backend
  const {
    data: profileData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['profile-full'],
    queryFn: () => profileService.getFullProfile(),
  });

  // Local state for professional identity inputs
  const [headline, setHeadline] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [careerGoals, setCareerGoals] = useState('');

  // Experience Sheet State
  const [isExpSheetOpen, setIsExpSheetOpen] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expType, setExpType] = useState<'Full-time' | 'Contract' | 'Freelance' | 'Part-time'>('Full-time');
  const [expLocation, setExpLocation] = useState('');
  const [expWorkplace, setExpWorkplace] = useState<'Remote' | 'Hybrid' | 'On-site'>('Remote');
  const [expStartDate, setExpStartDate] = useState('');
  const [expEndDate, setExpEndDate] = useState('');
  const [expIsCurrent, setExpIsCurrent] = useState(false);
  const [expDescription, setExpDescription] = useState('');
  const [expSkillsInput, setExpSkillsInput] = useState('');

  // Skills input state
  const [newSkill, setNewSkill] = useState('');

  // Document Viewer Sheet State
  const [selectedDoc, setSelectedDoc] = useState<ProfileDocument | null>(null);

  // Confirm Delete State
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState<string | null>(null);
  const [confirmDeleteExpId, setConfirmDeleteExpId] = useState<string | null>(null);

  // Action / Saving Status
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Sync inputs when profile data is retrieved
  useEffect(() => {
    if (profileData?.professional) {
      setHeadline(profileData.professional.headline || '');
      setCurrentRole(profileData.professional.currentRole || '');
      setCareerGoals(profileData.professional.careerGoals || '');
    } else if (user) {
      setHeadline(user.headline || user.targetOutcome || '');
    }
  }, [profileData, user]);

  const documents: ProfileDocument[] = profileData?.documents || [];
  const experiences: ProfileExperience[] = profileData?.professional?.experiences || [];
  const skills: ProfileSkill[] = profileData?.professional?.skills || [];

  // --- Document Upload ---
  const handleUploadDocument = async (isCV: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets?.[0]) {
        const file = res.assets[0];
        setIsUploadingDoc(true);

        const fileSizeFormatted = file.size
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : '1.0 MB';

        await profileService.uploadDocument({
          name: file.name,
          type: isCV ? 'cv' : 'portfolio',
          fileSize: fileSizeFormatted,
          fileUrl: file.uri,
        });

        await refetch();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast.success(`"${file.name}" uploaded successfully`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload document');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await profileService.deleteDocument(id);
      await refetch();
      setConfirmDeleteDocId(null);
      setSelectedDoc(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success('Document deleted');
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const handleOpenDoc = async (doc: ProfileDocument) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (doc.fileUrl) {
      await WebBrowser.openBrowserAsync(doc.fileUrl);
    } else {
      toast.info('Document preview is stored securely on device');
    }
  };

  // --- Experience Management ---
  const openAddExperience = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingExpId(null);
    setExpTitle('');
    setExpCompany('');
    setExpType('Full-time');
    setExpLocation('');
    setExpWorkplace('Remote');
    setExpStartDate('');
    setExpEndDate('');
    setExpIsCurrent(true);
    setExpDescription('');
    setExpSkillsInput('');
    setIsExpSheetOpen(true);
  };

  const openEditExperience = (exp: ProfileExperience) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingExpId(exp.id);
    setExpTitle(exp.role);
    setExpCompany(exp.company);
    setExpType('Full-time');
    setExpLocation('');
    setExpWorkplace('Remote');
    setExpStartDate(exp.period.split('-')[0]?.trim() || '');
    setExpEndDate(exp.period.split('-')[1]?.trim() || '');
    setExpIsCurrent(exp.period.toLowerCase().includes('present'));
    setExpDescription(exp.description);
    setExpSkillsInput(exp.highlights ? exp.highlights.join(', ') : '');
    setIsExpSheetOpen(true);
  };

  const handleSaveExperience = async () => {
    if (!expTitle.trim() || !expCompany.trim()) {
      toast.error('Role and company are required');
      return;
    }

    const skillsArray = expSkillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const periodString = `${expStartDate.trim() || '2024'} – ${
      expIsCurrent ? 'Present' : expEndDate.trim() || 'Present'
    }`;

    try {
      if (editingExpId) {
        await profileService.deleteExperience(editingExpId);
      }

      await profileService.addExperience({
        role: expTitle.trim(),
        company: expCompany.trim(),
        period: periodString,
        description: expDescription.trim(),
        highlights: skillsArray,
      });

      await refetch();
      setIsExpSheetOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success(editingExpId ? 'Experience updated' : 'Experience added');
    } catch {
      toast.error('Could not save experience');
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await profileService.deleteExperience(id);
      await refetch();
      setConfirmDeleteExpId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success('Experience removed');
    } catch {
      toast.error('Could not remove experience');
    }
  };

  // --- Skills Management ---
  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    const skillName = newSkill.trim();
    setNewSkill('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await profileService.addSkill({ name: skillName });
      await refetch();
      toast.success(`Added skill: ${skillName}`);
    } catch {
      toast.error('Could not save skill');
    }
  };

  const handleRemoveSkill = async (skillId: string, skillName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await profileService.deleteSkill(skillId);
      await refetch();
      toast.success(`Removed ${skillName}`);
    } catch {
      toast.error('Could not remove skill');
    }
  };

  // --- Save Headline & Goals ---
  const handleSaveAll = async () => {
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await profileService.updateProfessional({
        headline: headline.trim(),
        currentRole: currentRole.trim(),
        careerGoals: careerGoals.trim(),
      });

      updateUser({
        headline: headline.trim(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success('Career profile updated successfully');
    } catch {
      toast.error('Failed to update career profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? colors.card : '#F1F3F7' }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft2 size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Experience & Materials</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading your verified profile...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Professional Identity */}
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
              PROFESSIONAL IDENTITY
            </Text>

            <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Professional Headline
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: isDark ? colors.background : '#F8FAFC',
                    },
                  ]}
                  value={headline}
                  onChangeText={setHeadline}
                  placeholder="e.g. Senior Full-Stack Engineer · Mobile & Cloud"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={[styles.inputGroup, { marginTop: 12 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Current Role / Position
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: isDark ? colors.background : '#F8FAFC',
                    },
                  ]}
                  value={currentRole}
                  onChangeText={setCurrentRole}
                  placeholder="e.g. Lead Mobile Architect or Independent Consultant"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={[styles.inputGroup, { marginTop: 12 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Career Goals & Summary
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: isDark ? colors.background : '#F8FAFC',
                    },
                  ]}
                  value={careerGoals}
                  onChangeText={setCareerGoals}
                  multiline
                  numberOfLines={3}
                  placeholder="Describe your ideal roles, focus areas, and milestone goals..."
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </Card>
          </View>

          {/* Section 2: CV Versions & Uploadable Materials */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
                CV & RESUME MATERIALS
              </Text>
              <Badge label={`${documents.length} Uploaded`} variant="neutral" size="sm" />
            </View>

            {/* Action Row: Upload CV vs Upload Portfolio */}
            <View style={styles.uploadActionRow}>
              <TouchableOpacity
                style={[
                  styles.uploadActionBtn,
                  {
                    backgroundColor: colors.accent,
                    shadowColor: colors.accent,
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                  },
                ]}
                onPress={() => handleUploadDocument(true)}
                disabled={isUploadingDoc}
                activeOpacity={0.85}
              >
                {isUploadingDoc ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <DocumentUpload size={18} color="#FFFFFF" variant="Bold" />
                )}
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.uploadActionTitle}>Upload CV / Resume</Text>
                  <Text style={styles.uploadActionSub}>PDF, DOCX, or TXT</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.uploadActionBtn,
                  {
                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => handleUploadDocument(false)}
                activeOpacity={0.8}
              >
                <FolderOpen size={18} color={colors.text} variant="Bold" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.uploadActionTitle, { color: colors.text }]}>Add Portfolio</Text>
                  <Text style={[styles.uploadActionSub, { color: colors.textMuted }]}>
                    Certificates, samples
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Documents List or Empty State */}
            {documents.length === 0 ? (
              <View
                style={[
                  styles.emptyStateCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <View
                  style={[
                    styles.emptyStateIconWrap,
                    { backgroundColor: colors.accent + '15' },
                  ]}
                >
                  <DocumentUpload size={28} color={colors.accent} variant="Bold" />
                </View>
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                  No CV or resumes uploaded yet
                </Text>
                <Text style={[styles.emptyStateSubtitle, { color: colors.textMuted }]}>
                  Upload your CV or portfolio documents to automatically power background matching radars and tailored proposals.
                </Text>
                <TouchableOpacity
                  style={[styles.emptyStateCta, { backgroundColor: colors.accent }]}
                  onPress={() => handleUploadDocument(true)}
                  activeOpacity={0.85}
                >
                  <Add size={16} color="#FFFFFF" variant="Bold" />
                  <Text style={styles.emptyStateCtaText}>Upload Your CV</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 10, marginTop: 12 }}>
                {documents.map((doc) => (
                  <Card
                    key={doc.id}
                    style={[
                      styles.docCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.docMainRow}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedDoc(doc);
                      }}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.docIconWrap,
                          {
                            backgroundColor:
                              doc.type === 'cv'
                                ? colors.accent + '15'
                                : '#3B82F615',
                          },
                        ]}
                      >
                        <DocumentText
                          size={22}
                          color={doc.type === 'cv' ? colors.accent : '#3B82F6'}
                          variant="Bold"
                        />
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.docName, { color: colors.text }]} numberOfLines={1}>
                          {doc.name}
                        </Text>
                        <Text style={[styles.docMeta, { color: colors.textMuted }]}>
                          {doc.fileSize || 'Document'} · Tap to preview
                        </Text>
                      </View>

                      <View style={styles.docActionsRight}>
                        <TouchableOpacity
                          style={styles.previewIconBtn}
                          onPress={() => setSelectedDoc(doc)}
                          activeOpacity={0.7}
                        >
                          <Eye size={18} color={colors.accent} variant="Bold" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.trashIconBtn}
                          onPress={() => setConfirmDeleteDocId(doc.id)}
                          activeOpacity={0.7}
                        >
                          <Trash size={17} color="#EF4444" variant="Linear" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </Card>
                ))}
              </View>
            )}
          </View>

          {/* Section 3: Professional Experience History */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
                  WORK EXPERIENCE
                </Text>
                <Text style={[styles.sectionSubHeading, { color: colors.textSecondary }]}>
                  Your verified career history & past roles
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.addExpBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 102, 0, 0.15)' : '#FFF7ED',
                    borderColor: colors.accent,
                  },
                ]}
                onPress={openAddExperience}
                activeOpacity={0.8}
              >
                <Add size={16} color={colors.accent} variant="Bold" />
                <Text style={[styles.addExpBtnText, { color: colors.accent }]}>
                  Add Role
                </Text>
              </TouchableOpacity>
            </View>

            {/* Experience List or Clean Empty State */}
            {experiences.length === 0 ? (
              <View
                style={[
                  styles.emptyStateCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <View
                  style={[
                    styles.emptyStateIconWrap,
                    { backgroundColor: isDark ? '#1E293B' : '#EEF2F6' },
                  ]}
                >
                  <Briefcase size={28} color={colors.accent} variant="Bold" />
                </View>
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                  No work experience listed yet
                </Text>
                <Text style={[styles.emptyStateSubtitle, { color: colors.textMuted }]}>
                  Add past positions, leadership roles, or projects so our agent can calibrate matching scores and generate high-signal pitches.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.emptyStateCta,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: colors.accent,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={openAddExperience}
                  activeOpacity={0.85}
                >
                  <Add size={16} color={colors.accent} variant="Bold" />
                  <Text style={[styles.emptyStateCtaText, { color: colors.accent }]}>
                    Add Experience
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.timelineContainer}>
                {experiences.map((exp, idx) => (
                  <View key={exp.id} style={styles.timelineItem}>
                    {idx < experiences.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          { backgroundColor: colors.borderSubtle },
                        ]}
                      />
                    )}

                    <View
                      style={[
                        styles.companyMonogram,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#EEF2F6',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Building size={18} color={colors.accent} variant="Bold" />
                    </View>

                    <Card
                      style={[
                        styles.expCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.expHeaderRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.expRoleTitle, { color: colors.text }]}>
                            {exp.role}
                          </Text>
                          <Text style={[styles.expCompany, { color: colors.textSecondary }]}>
                            {exp.company}
                          </Text>
                        </View>

                        <View style={styles.expCardActions}>
                          <TouchableOpacity
                            style={styles.actionIconBtn}
                            onPress={() => openEditExperience(exp)}
                            activeOpacity={0.7}
                          >
                            <Edit2 size={16} color={colors.textSecondary} variant="Linear" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionIconBtn}
                            onPress={() => setConfirmDeleteExpId(exp.id)}
                            activeOpacity={0.7}
                          >
                            <Trash size={16} color="#EF4444" variant="Linear" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.expMetaRow}>
                        <View style={styles.metaBadge}>
                          <Calendar size={13} color={colors.textMuted} variant="Linear" />
                          <Text style={[styles.metaText, { color: colors.textMuted }]}>
                            {exp.period}
                          </Text>
                        </View>
                      </View>

                      {exp.description ? (
                        <Text style={[styles.expDesc, { color: colors.textSecondary }]}>
                          {exp.description}
                        </Text>
                      ) : null}

                      {exp.highlights && exp.highlights.length > 0 && (
                        <View style={styles.expSkillsRow}>
                          {exp.highlights.map((h, i) => (
                            <View
                              key={i}
                              style={[
                                styles.expSkillPill,
                                {
                                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.expSkillText,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                {h}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </Card>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Section 4: Technical Skills */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
                CORE SKILLS & TECHNOLOGIES
              </Text>
              <Badge label={`${skills.length} Skills`} variant="neutral" size="sm" />
            </View>

            <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Input Row to Add Skill */}
              <View style={styles.skillInputRow}>
                <TextInput
                  style={[
                    styles.skillInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: isDark ? colors.background : '#F8FAFC',
                    },
                  ]}
                  value={newSkill}
                  onChangeText={setNewSkill}
                  placeholder="Add skill (e.g. React Native, PostgreSQL, AI)..."
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={handleAddSkill}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[
                    styles.addSkillBtn,
                    { backgroundColor: colors.accent },
                  ]}
                  onPress={handleAddSkill}
                  activeOpacity={0.8}
                >
                  <Add size={20} color="#FFFFFF" variant="Bold" />
                </TouchableOpacity>
              </View>

              {/* Skills Chips or Empty State */}
              {skills.length === 0 ? (
                <View style={styles.emptySkillsWrap}>
                  <Code size={18} color={colors.textMuted} variant="Linear" />
                  <Text style={[styles.emptySkillsText, { color: colors.textMuted }]}>
                    No skills added yet. Type a technology or competency above and tap Add.
                  </Text>
                </View>
              ) : (
                <View style={styles.skillsChipsWrap}>
                  {skills.map((skill) => (
                    <View
                      key={skill.id}
                      style={[
                        styles.skillChip,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.skillChipText, { color: colors.text }]}>
                        {skill.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveSkill(skill.id, skill.name)}
                        style={styles.skillRemoveBtn}
                      >
                        <Text style={{ color: colors.textMuted, fontSize: 13 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          </View>

          {/* Save Changes Button */}
          <View style={styles.saveWrap}>
            <Button
              title={isSaving ? 'Saving Profile...' : 'Save Career & Experience'}
              variant="accent"
              size="lg"
              onPress={handleSaveAll}
              isLoading={isSaving}
            />
          </View>
        </ScrollView>
      )}

      {/* In-App Document Viewer & Preview BottomSheet */}
      {selectedDoc && (
        <BottomSheet
          visible={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          title="Document & CV Details"
          subtitle={selectedDoc.name}
        >
          <View style={{ paddingBottom: 20 }}>
            <View
              style={[
                styles.viewerHeaderCard,
                { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: colors.border },
              ]}
            >
              <DocumentText size={32} color={colors.accent} variant="Bold" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.viewerDocTitle, { color: colors.text }]}>
                  {selectedDoc.name}
                </Text>
                <Text style={[styles.viewerDocMeta, { color: colors.textMuted }]}>
                  {selectedDoc.fileSize || 'Standard file'} · Uploaded {new Date(selectedDoc.uploadedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={[styles.viewerPrimaryBtn, { backgroundColor: colors.accent }]}
                onPress={() => handleOpenDoc(selectedDoc)}
                activeOpacity={0.8}
              >
                <ExportSquare size={18} color="#FFFFFF" variant="Bold" />
                <Text style={styles.viewerPrimaryBtnText}>Open Document</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.viewerSecondaryBtn,
                  {
                    borderColor: '#EF4444',
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
                  },
                ]}
                onPress={() => setConfirmDeleteDocId(selectedDoc.id)}
                activeOpacity={0.8}
              >
                <Trash size={18} color="#EF4444" variant="Bold" />
                <Text style={[styles.viewerSecondaryBtnText, { color: '#EF4444' }]}>
                  Delete Document
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheet>
      )}

      {/* Add / Edit Experience BottomSheet */}
      <BottomSheet
        visible={isExpSheetOpen}
        onClose={() => setIsExpSheetOpen(false)}
        title={editingExpId ? 'Edit Work Experience' : 'Add Work Experience'}
        subtitle="Record your positions and accomplishments"
      >
        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
          <View style={{ paddingBottom: 20 }}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Job Title / Role *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: isDark ? colors.background : '#F8FAFC',
                  },
                ]}
                value={expTitle}
                onChangeText={setExpTitle}
                placeholder="e.g. Lead Software Engineer"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={[styles.inputGroup, { marginTop: 12 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Company / Organization *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: isDark ? colors.background : '#F8FAFC',
                  },
                ]}
                value={expCompany}
                onChangeText={setExpCompany}
                placeholder="e.g. Acme Corp or Self-Employed"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Dates */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Start Date
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: isDark ? colors.background : '#F8FAFC',
                    },
                  ]}
                  value={expStartDate}
                  onChangeText={setExpStartDate}
                  placeholder="e.g. Jan 2023"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  End Date
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: isDark ? colors.background : '#F8FAFC',
                      opacity: expIsCurrent ? 0.5 : 1,
                    },
                  ]}
                  value={expIsCurrent ? 'Present' : expEndDate}
                  onChangeText={setExpEndDate}
                  editable={!expIsCurrent}
                  placeholder="e.g. Present"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Currently Working Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setExpIsCurrent(!expIsCurrent)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkboxBox,
                  {
                    borderColor: expIsCurrent ? colors.accent : colors.border,
                    backgroundColor: expIsCurrent ? colors.accent : 'transparent',
                  },
                ]}
              >
                {expIsCurrent && <TickCircle size={14} color="#FFF" variant="Bold" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                I currently work in this role
              </Text>
            </TouchableOpacity>

            {/* Description */}
            <View style={[styles.inputGroup, { marginTop: 12 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Description & Key Accomplishments
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: isDark ? colors.background : '#F8FAFC',
                  },
                ]}
                value={expDescription}
                onChangeText={setExpDescription}
                multiline
                numberOfLines={4}
                placeholder="Outline your impact, projects built, and milestones achieved..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Highlights / Skills used */}
            <View style={[styles.inputGroup, { marginTop: 12 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Highlights & Tech Stack (comma-separated)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: isDark ? colors.background : '#F8FAFC',
                  },
                ]}
                value={expSkillsInput}
                onChangeText={setExpSkillsInput}
                placeholder="e.g. React Native, TypeScript, Systems Design"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={{ marginTop: SPACING.lg }}>
              <Button
                title={editingExpId ? 'Update Experience' : 'Save Experience'}
                variant="accent"
                size="lg"
                onPress={handleSaveExperience}
              />
            </View>
          </View>
        </ScrollView>
      </BottomSheet>

      {/* Delete Document Confirmation BottomSheet */}
      <ConfirmBottomSheet
        visible={!!confirmDeleteDocId}
        title="Delete Document?"
        description="Are you sure you want to remove this document? Any automated matching criteria linked to this CV will be refreshed."
        confirmText="Delete Document"
        cancelText="Keep Document"
        variant="destructive"
        icon={<Trash size={36} color="#EF4444" variant="Bold" />}
        onConfirm={() => {
          if (confirmDeleteDocId) handleDeleteDoc(confirmDeleteDocId);
        }}
        onCancel={() => setConfirmDeleteDocId(null)}
      />

      {/* Delete Experience Confirmation BottomSheet */}
      <ConfirmBottomSheet
        visible={!!confirmDeleteExpId}
        title="Delete Experience Entry?"
        description="Are you sure you want to delete this work experience entry? This change will be reflected in your profile and radar calibration."
        confirmText="Delete Role"
        cancelText="Cancel"
        variant="destructive"
        icon={<Trash size={36} color="#EF4444" variant="Bold" />}
        onConfirm={() => {
          if (confirmDeleteExpId) handleDeleteExperience(confirmDeleteExpId);
        }}
        onCancel={() => setConfirmDeleteExpId(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 17,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  sectionWrap: {
    marginBottom: SPACING.lg,
  },
  sectionHeading: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionSubHeading: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: -4,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  card: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
  },
  inputGroup: {
    width: '100%',
  },
  inputLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontFamily: FONTS.regular,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    fontFamily: FONTS.regular,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  uploadActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  uploadActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  uploadActionTitle: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 13,
  },
  uploadActionSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: FONTS.regular,
    fontSize: 11,
    marginTop: 2,
  },
  emptyStateCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  emptyStateIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: SPACING.md,
  },
  emptyStateCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.full,
  },
  emptyStateCtaText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 13,
  },
  docCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.md,
  },
  docMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },
  docMeta: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    marginTop: 2,
  },
  docActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewIconBtn: {
    padding: 6,
  },
  trashIconBtn: {
    padding: 6,
  },
  addExpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  addExpBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  timelineContainer: {
    marginTop: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    position: 'relative',
    marginBottom: 14,
  },
  timelineLine: {
    position: 'absolute',
    left: 19,
    top: 40,
    bottom: -16,
    width: 2,
  },
  companyMonogram: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
  },
  expHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  expRoleTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  expCompany: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    marginTop: 2,
  },
  expCardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionIconBtn: {
    padding: 5,
  },
  expMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 6,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
  },
  expDesc: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  expSkillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  expSkillPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  expSkillText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
  },
  skillInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  skillInput: {
    flex: 1,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontFamily: FONTS.regular,
    fontSize: 13.5,
  },
  addSkillBtn: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySkillsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: SPACING.sm,
  },
  emptySkillsText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 12.5,
  },
  skillsChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: SPACING.md,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    gap: 6,
  },
  skillChipText: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
  },
  skillRemoveBtn: {
    padding: 2,
  },
  saveWrap: {
    marginTop: SPACING.lg,
  },
  viewerHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  viewerDocTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  viewerDocMeta: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 2,
  },
  viewerPrimaryBtn: {
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewerPrimaryBtnText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  viewerSecondaryBtn: {
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 8,
  },
  viewerSecondaryBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13.5,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontFamily: FONTS.medium,
    fontSize: 13.5,
  },
});
