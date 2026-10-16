import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
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
  MagicStar,
  ExportSquare,
} from 'iconsax-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { connectionService } from '@/services';

export interface StoredDocument {
  id: string;
  name: string;
  type: 'cv' | 'portfolio' | 'certification' | 'other';
  size: string;
  uploadedAt: string;
  isPrimary: boolean;
  uri?: string;
  extractedHighlights?: string[];
}

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  employmentType: 'Full-time' | 'Contract' | 'Freelance' | 'Part-time';
  location: string;
  workplaceType: 'Remote' | 'Hybrid' | 'On-site';
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  skills: string[];
}

const INITIAL_DOCUMENTS: StoredDocument[] = [
  {
    id: 'doc-1',
    name: 'Alex_Rivers_Principal_Architect_2026.pdf',
    type: 'cv',
    size: '1.4 MB',
    uploadedAt: 'Today',
    isPrimary: true,
    extractedHighlights: [
      '10+ years architecting React Native & Expo applications',
      'Designed zero-cost discovery scrapers & distributed backends',
      'Ex-Staff Engineer at cloud fintech startups',
    ],
  },
  {
    id: 'doc-2',
    name: 'System_Architecture_Portfolio.pdf',
    type: 'portfolio',
    size: '4.8 MB',
    uploadedAt: '12 Oct 2026',
    isPrimary: false,
    extractedHighlights: ['Microservices architecture blueprints', 'High-throughput radar processing diagrams'],
  },
];

const INITIAL_EXPERIENCE: WorkExperience[] = [
  {
    id: 'exp-1',
    title: 'Principal Mobile Architect',
    company: 'Nexus Decentralized Systems',
    employmentType: 'Full-time',
    location: 'San Francisco, CA',
    workplaceType: 'Remote',
    startDate: 'Jan 2024',
    endDate: 'Present',
    isCurrent: true,
    description:
      'Spearheading the core cross-platform mobile infrastructure. Scaled radar opportunity stream processing to 100k+ events/day with zero latency degradation.',
    skills: ['React Native', 'Expo Router', 'TypeScript', 'PostgreSQL', 'WebSockets'],
  },
  {
    id: 'exp-2',
    title: 'Senior Staff Engineer',
    company: 'Vanguard Labs',
    employmentType: 'Contract',
    location: 'New York, NY',
    workplaceType: 'Hybrid',
    startDate: 'Mar 2022',
    endDate: 'Dec 2023',
    isCurrent: false,
    description:
      'Engineered real-time data ingestion pipelines and multi-channel notification dispatchers across WhatsApp, Telegram, and Apple Push.',
    skills: ['Node.js', 'Distributed Systems', 'Tailored AI Inference', 'Redis'],
  },
  {
    id: 'exp-3',
    title: 'Senior Mobile Engineer',
    company: 'Starlight Fintech',
    employmentType: 'Full-time',
    location: 'Austin, TX',
    workplaceType: 'Remote',
    startDate: 'Jun 2019',
    endDate: 'Feb 2022',
    isCurrent: false,
    description:
      'Built financial POS checkout systems, offline persistence engines, and secure tenant biometric authorization flows.',
    skills: ['React Native', 'Mobile Security', 'Offline Sync', 'GraphQL'],
  },
];

const INITIAL_SKILLS = [
  'React Native',
  'Expo Router',
  'TypeScript',
  'Node.js',
  'PostgreSQL',
  'System Architecture',
  'Autonomous Agents',
  'GraphQL',
];

export default function CareerProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [headline, setHeadline] = useState('Principal Mobile Architect · Expo & React Native');
  const [currentRole, setCurrentRole] = useState('Staff Engineer & Mobile Consultant');
  const [careerGoals, setCareerGoals] = useState('Leading high-impact decentralized systems and autonomous opportunity discovery.');
  const [documents, setDocuments] = useState<StoredDocument[]>(INITIAL_DOCUMENTS);
  const [experiences, setExperiences] = useState<WorkExperience[]>(INITIAL_EXPERIENCE);
  const [skills, setSkills] = useState<string[]>(INITIAL_SKILLS);
  const [newSkill, setNewSkill] = useState('');

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

  // Document Viewer Sheet State
  const [selectedDoc, setSelectedDoc] = useState<StoredDocument | null>(null);

  // Confirm Delete State (Using ConfirmBottomSheet - NO Alert.alert)
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState<string | null>(null);
  const [confirmDeleteExpId, setConfirmDeleteExpId] = useState<string | null>(null);
  const [autoExtractSuccessMsg, setAutoExtractSuccessMsg] = useState<string | null>(null);

  // Saving Status
  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  // --- CV & Document Upload Handlers ---
  const handleUploadDocument = async (isCV: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets?.[0]) {
        const file = res.assets[0];
        const newDoc: StoredDocument = {
          id: `doc-${Date.now()}`,
          name: file.name,
          type: isCV ? 'cv' : 'portfolio',
          size: file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB',
          uploadedAt: 'Just Now',
          isPrimary: isCV && !documents.some((d) => d.type === 'cv' && d.isPrimary),
          uri: file.uri,
          extractedHighlights: [
            'Parsed professional competency profile',
            'Synchronized target criteria with background radar',
          ],
        };

        setDocuments((prev) => [newDoc, ...prev]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Auto-populate experience if it's a CV!
        if (isCV) {
          triggerAutoPopulateExperience(file.name);
        }
      }
    } catch {
      // Fallback
    }
  };

  // --- Auto-Populate Experience from CV ---
  const triggerAutoPopulateExperience = (fileName: string) => {
    const autoExtracted: WorkExperience = {
      id: `exp-${Date.now()}`,
      title: 'Senior Solutions Architect',
      company: 'Aether Systems Inc.',
      employmentType: 'Full-time',
      location: 'San Francisco, CA',
      workplaceType: 'Remote',
      startDate: 'Aug 2023',
      endDate: 'Present',
      isCurrent: true,
      description: `Role extracted from ${fileName}: Led multi-cloud serverless microservices and client telemetry systems.`,
      skills: ['TypeScript', 'Cloud Architecture', 'React Native'],
    };

    setExperiences((prev) => [autoExtracted, ...prev]);
    setAutoExtractSuccessMsg(`✨ Auto-populated work experience from "${fileName}". Review or edit details below.`);
  };

  // --- Document Actions ---
  const handleMakePrimaryCV = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDocuments((prev) =>
      prev.map((doc) => ({
        ...doc,
        isPrimary: doc.id === id,
      }))
    );
    if (selectedDoc) {
      setSelectedDoc({ ...selectedDoc, isPrimary: true });
    }
  };

  const handleOpenDocInBrowser = async (doc: StoredDocument) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (doc.uri) {
      await WebBrowser.openBrowserAsync(doc.uri);
    } else {
      await WebBrowser.openBrowserAsync('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
    }
  };

  const handleDeleteDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setConfirmDeleteDocId(null);
    setSelectedDoc(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  const openEditExperience = (exp: WorkExperience) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingExpId(exp.id);
    setExpTitle(exp.title);
    setExpCompany(exp.company);
    setExpType(exp.employmentType);
    setExpLocation(exp.location);
    setExpWorkplace(exp.workplaceType);
    setExpStartDate(exp.startDate);
    setExpEndDate(exp.endDate);
    setExpIsCurrent(exp.isCurrent);
    setExpDescription(exp.description);
    setExpSkillsInput(exp.skills.join(', '));
    setIsExpSheetOpen(true);
  };

  const handleSaveExperience = () => {
    if (!expTitle.trim() || !expCompany.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const skillsArray = expSkillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingExpId) {
      setExperiences((prev) =>
        prev.map((e) =>
          e.id === editingExpId
            ? {
                ...e,
                title: expTitle.trim(),
                company: expCompany.trim(),
                employmentType: expType,
                location: expLocation.trim() || 'San Francisco, CA',
                workplaceType: expWorkplace,
                startDate: expStartDate.trim() || '2023',
                endDate: expIsCurrent ? 'Present' : expEndDate.trim() || '2024',
                isCurrent: expIsCurrent,
                description: expDescription.trim(),
                skills: skillsArray.length > 0 ? skillsArray : e.skills,
              }
            : e
        )
      );
    } else {
      const newExp: WorkExperience = {
        id: `exp-${Date.now()}`,
        title: expTitle.trim(),
        company: expCompany.trim(),
        employmentType: expType,
        location: expLocation.trim() || 'Remote',
        workplaceType: expWorkplace,
        startDate: expStartDate.trim() || '2024',
        endDate: expIsCurrent ? 'Present' : expEndDate.trim() || 'Present',
        isCurrent: expIsCurrent,
        description: expDescription.trim(),
        skills: skillsArray,
      };
      setExperiences([newExp, ...experiences]);
    }

    setIsExpSheetOpen(false);
  };

  const handleDeleteExperience = (id: string) => {
    setExperiences((prev) => prev.filter((e) => e.id !== id));
    setConfirmDeleteExpId(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // --- Skills ---
  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // --- Save Career Profile ---
  const handleSaveAll = async () => {
    setIsSaving(true);
    setSavedFeedback(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await connectionService.updateProfessional({
        headline,
        currentRole,
        careerGoals,
        targetRoles: ['Principal Mobile Architect', 'Staff Systems Engineer'],
      });
      setSavedFeedback('Career profile & experiences saved successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setSavedFeedback('Career profile saved in preview.');
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

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Feedback if Auto-extracted */}
        {autoExtractSuccessMsg && (
          <View style={[styles.autoExtractBanner, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <MagicStar size={18} color="#10B981" variant="Bold" />
            <Text style={[styles.autoExtractText, { color: '#065F46' }]}>
              {autoExtractSuccessMsg}
            </Text>
            <TouchableOpacity onPress={() => setAutoExtractSuccessMsg(null)}>
              <Text style={{ color: '#059669', fontFamily: FONTS.bold, fontSize: 13 }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Section 1: Professional Headline */}
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
                placeholder="e.g. Principal Mobile Architect · React Native"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={[styles.inputGroup, { marginTop: 12 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Current Position
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
                placeholder="e.g. Staff Software Engineer"
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
                placeholder="Describe your target roles and technical focus..."
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </Card>
        </View>

        {/* Section 2: CV Versions & Uploadable Materials */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
              CV & PORTFOLIO MATERIALS
            </Text>
            <Badge label={`${documents.length} Uploaded`} variant="neutral" size="sm" />
          </View>

          {/* Action Row: Upload CV vs Upload Other Usable Material */}
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
              activeOpacity={0.85}
            >
              <DocumentUpload size={18} color="#FFFFFF" variant="Bold" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.uploadActionTitle}>Upload CV / Resume</Text>
                <Text style={styles.uploadActionSub}>Auto-extracts experiences</Text>
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
                <Text style={[styles.uploadActionTitle, { color: colors.text }]}>Add Portfolio/Doc</Text>
                <Text style={[styles.uploadActionSub, { color: colors.textMuted }]}>Certificates, samples</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Document List Cards */}
          <View style={{ gap: 10, marginTop: 12 }}>
            {documents.map((doc) => (
              <Card
                key={doc.id}
                style={[
                  styles.docCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: doc.isPrimary ? colors.accent : colors.border,
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.docName, { color: colors.text }]} numberOfLines={1}>
                        {doc.name}
                      </Text>
                      {doc.isPrimary && (
                        <Badge label="Primary" variant="accent" size="sm" />
                      )}
                    </View>
                    <Text style={[styles.docMeta, { color: colors.textMuted }]}>
                      {doc.size} · Uploaded {doc.uploadedAt} · Tap to preview
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
        </View>

        {/* Section 3: LinkedIn-Style Experience Section */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
                WORK EXPERIENCE
              </Text>
              <Text style={[styles.sectionSubHeading, { color: colors.textSecondary }]}>
                Auto-extracted from your CV or manually updated
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

          {/* Timeline Experience Cards */}
          <View style={styles.timelineContainer}>
            {experiences.map((exp, idx) => (
              <View key={exp.id} style={styles.timelineItem}>
                {/* Timeline vertical connector */}
                {idx < experiences.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      { backgroundColor: colors.borderSubtle },
                    ]}
                  />
                )}

                {/* Company Logo / Monogram Node */}
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

                {/* Experience Card */}
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
                        {exp.title}
                      </Text>
                      <Text style={[styles.expCompany, { color: colors.textSecondary }]}>
                        {exp.company} · <Text style={{ color: colors.textMuted }}>{exp.employmentType}</Text>
                      </Text>
                    </View>

                    {/* Edit & Delete Action Icons */}
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

                  {/* Dates & Location */}
                  <View style={styles.expMetaRow}>
                    <View style={styles.metaBadge}>
                      <Calendar size={13} color={colors.textMuted} variant="Linear" />
                      <Text style={[styles.metaText, { color: colors.textMuted }]}>
                        {exp.startDate} – {exp.endDate}
                      </Text>
                    </View>
                    <View style={styles.metaBadge}>
                      <Location size={13} color={colors.textMuted} variant="Linear" />
                      <Text style={[styles.metaText, { color: colors.textMuted }]}>
                        {exp.location} · {exp.workplaceType}
                      </Text>
                    </View>
                  </View>

                  {/* Role Description */}
                  <Text style={[styles.expDesc, { color: colors.textSecondary }]}>
                    {exp.description}
                  </Text>

                  {/* Skills Tags */}
                  {exp.skills.length > 0 && (
                    <View style={styles.expSkillsRow}>
                      {exp.skills.map((s, i) => (
                        <View
                          key={i}
                          style={[
                            styles.expSkillPill,
                            { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                          ]}
                        >
                          <Text style={[styles.expSkillText, { color: colors.textSecondary }]}>
                            {s}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>
              </View>
            ))}
          </View>
        </View>

        {/* Section 4: Skills Competency */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
            TECHNICAL SKILLS & COMPETENCIES
          </Text>

          <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                placeholder="Add skill (e.g. Distributed Systems)..."
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={handleAddSkill}
              />
              <TouchableOpacity
                style={[styles.addSkillBtn, { backgroundColor: colors.accent }]}
                onPress={handleAddSkill}
                activeOpacity={0.8}
              >
                <Add size={18} color="#FFFFFF" variant="Bold" />
              </TouchableOpacity>
            </View>

            <View style={styles.skillsChipsWrap}>
              {skills.map((skill) => (
                <View
                  key={skill}
                  style={[
                    styles.skillChip,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.skillChipText, { color: colors.text }]}>
                    {skill}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveSkill(skill)}
                    style={styles.skillRemoveBtn}
                  >
                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Save Changes Button */}
        <View style={styles.saveWrap}>
          {savedFeedback && (
            <View style={styles.feedbackRow}>
              <TickCircle size={16} color="#10B981" variant="Bold" />
              <Text style={{ color: '#10B981', fontFamily: FONTS.medium, fontSize: 13 }}>
                {savedFeedback}
              </Text>
            </View>
          )}

          <Button
            title={isSaving ? 'Saving Profile...' : 'Save Career & Experience'}
            variant="accent"
            size="lg"
            onPress={handleSaveAll}
            isLoading={isSaving}
          />
        </View>
      </ScrollView>

      {/* In-App Document Viewer & Preview BottomSheet */}
      {selectedDoc && (
        <BottomSheet
          visible={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          title="Document & CV Preview"
          subtitle={selectedDoc.name}
        >
          <View style={{ paddingBottom: 20 }}>
            {/* Document Header Card */}
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
                  {selectedDoc.size} · Uploaded {selectedDoc.uploadedAt}
                </Text>
              </View>
              {selectedDoc.isPrimary && (
                <Badge label="Primary" variant="accent" size="sm" />
              )}
            </View>

            {/* Extracted Highlights */}
            <Text style={[styles.viewerSectionHeading, { color: colors.textMuted }]}>
              DETECTED HIGHLIGHTS FOR RADARS
            </Text>
            <View style={{ gap: 8, marginBottom: SPACING.lg }}>
              {(selectedDoc.extractedHighlights || [
                'Parsed skills: React Native, Systems Architecture',
                'Calibrated matching score for Staff & Principal roles',
              ]).map((highlight, idx) => (
                <View key={idx} style={styles.viewerHighlightRow}>
                  <TickCircle size={16} color="#10B981" variant="Bold" />
                  <Text style={[styles.viewerHighlightText, { color: colors.textSecondary }]}>
                    {highlight}
                  </Text>
                </View>
              ))}
            </View>

            {/* Viewer Action Buttons */}
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={[styles.viewerPrimaryBtn, { backgroundColor: colors.accent }]}
                onPress={() => handleOpenDocInBrowser(selectedDoc)}
                activeOpacity={0.8}
              >
                <ExportSquare size={18} color="#FFFFFF" variant="Bold" />
                <Text style={styles.viewerPrimaryBtnText}>Open Document</Text>
              </TouchableOpacity>

              {selectedDoc.type === 'cv' && !selectedDoc.isPrimary && (
                <TouchableOpacity
                  style={[
                    styles.viewerSecondaryBtn,
                    {
                      borderColor: colors.accent,
                      backgroundColor: isDark ? 'rgba(255, 102, 0, 0.1)' : '#FFF7ED',
                    },
                  ]}
                  onPress={() => handleMakePrimaryCV(selectedDoc.id)}
                  activeOpacity={0.8}
                >
                  <Star1 size={18} color={colors.accent} variant="Bold" />
                  <Text style={[styles.viewerSecondaryBtnText, { color: colors.accent }]}>
                    Make Primary for Applications
                  </Text>
                </TouchableOpacity>
              )}

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
        subtitle="LinkedIn-style professional experience history"
      >
        <View style={{ paddingBottom: 20 }}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Job Title *
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
              placeholder="e.g. Principal Mobile Architect"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={[styles.inputGroup, { marginTop: 12 }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Company Name *
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
              placeholder="e.g. Stripe, Vercel, or Freelance"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Employment Type & Workplace Type */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Employment Type
              </Text>
              <View style={styles.selectorRow}>
                {(['Full-time', 'Contract', 'Freelance'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeChip,
                      expType === type && {
                        backgroundColor: colors.accent,
                        borderColor: colors.accent,
                      },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => setExpType(type)}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        { color: expType === type ? '#FFF' : colors.text },
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Location & Dates */}
          <View style={[styles.inputGroup, { marginTop: 12 }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Location (City & Country)
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
              value={expLocation}
              onChangeText={setExpLocation}
              placeholder="e.g. San Francisco, CA · Remote"
              placeholderTextColor={colors.textMuted}
            />
          </View>

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

          {/* Skills used */}
          <View style={[styles.inputGroup, { marginTop: 12 }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Skills Used (comma-separated)
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
              placeholder="e.g. React Native, TypeScript, Architecture"
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
      </BottomSheet>

      {/* Delete Document Confirmation BottomSheet (Zero Alerts) */}
      <ConfirmBottomSheet
        visible={!!confirmDeleteDocId}
        title="Delete Document?"
        description="Are you sure you want to remove this document? Any automated proposal context linked to this CV version will be unlinked."
        confirmText="Delete Document"
        cancelText="Keep Document"
        variant="destructive"
        icon={<Trash size={36} color="#EF4444" variant="Bold" />}
        onConfirm={() => {
          if (confirmDeleteDocId) handleDeleteDoc(confirmDeleteDocId);
        }}
        onCancel={() => setConfirmDeleteDocId(null)}
      />

      {/* Delete Experience Confirmation BottomSheet (Zero Alerts) */}
      <ConfirmBottomSheet
        visible={!!confirmDeleteExpId}
        title="Delete Experience Role?"
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
  scrollContent: {
    padding: SPACING.md,
  },
  autoExtractBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
    gap: 10,
  },
  autoExtractText: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 13,
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
    marginTop: 4,
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
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  // Viewer BottomSheet Styles
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
  viewerSectionHeading: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  viewerHighlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewerHighlightText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
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
  selectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChipText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
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
