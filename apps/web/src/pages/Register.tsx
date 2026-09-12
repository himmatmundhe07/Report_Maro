import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { registerRequestSchema, type UserRole } from '@sih/shared-types';
import { apiClient, apiErrorMessage } from '../lib/apiClient.js';
import { useAuthStore } from '../store/authStore.js';
import { Button } from '../components/Button.js';
import {
  JHARKHAND_DISTRICTS,
  getBlocksForDistrict,
  getDistrictByName,
  getVillagesForBlock,
} from '../data/jharkhandLgd.js';
import {
  useJharkhandUniversities,
  getUniversityById,
  saveUniversityDepartmentsToDb,
} from '../data/jharkhandUniversities.js';

interface PostalPostOffice {
  Name: string;
  District: string;
  Block: string;
  State: string;
  Pincode: string;
}

export type UniversityRegisterSubRole = 'student' | 'mentor' | 'institution';
export type GovernmentRegisterSubRole = 'state' | 'district' | 'department';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);

  const searchParams = new URLSearchParams(location.search);
  const queryRole = searchParams.get('role');
  const queryType = searchParams.get('type');
  const queryFor = searchParams.get('for');

  // Role locking logic:
  // 1. If coming from "Submit a Problem" or queryRole=citizen -> Lock to Citizen Mode
  // 2. If coming to University Portal or queryRole=university -> Lock to University Mode
  // 3. If coming to Industry Portal or queryRole=industry -> Lock to Industry Mode
  const isCitizenTarget = queryRole === 'citizen' || queryFor === 'submit';
  const isUniversityTarget = queryRole === 'university';
  const isIndustryTarget = queryRole === 'industry';
  const isGovernmentTarget = queryRole === 'government';

  const [showAllRoles, setShowAllRoles] = useState(false);

  const isCitizenOnly = !showAllRoles && isCitizenTarget && !isUniversityTarget && !isIndustryTarget;
  const isUniversityOnly = !showAllRoles && isUniversityTarget && !isIndustryTarget;
  const isIndustryOnly = !showAllRoles && isIndustryTarget && !isCitizenTarget && !isUniversityTarget;
  const isGovernmentOnly = !showAllRoles && isGovernmentTarget && !isCitizenTarget && !isUniversityTarget && !isIndustryTarget;

  // Role
  const [role, setRole] = useState<UserRole>(() => {
    if (isUniversityTarget) return 'university';
    if (isIndustryTarget) return 'industry';
    if (isGovernmentTarget) return 'government';
    return 'citizen';
  });

  // Government Sub-Role
  const [govSubRole, setGovSubRole] = useState<GovernmentRegisterSubRole>(() => {
    if (queryType === 'district') return 'district';
    if (queryType === 'department') return 'department';
    return 'state';
  });

  // University Sub-Role
  const [univSubRole, setUnivSubRole] = useState<UniversityRegisterSubRole>(() => {
    if (queryType === 'mentor') return 'mentor';
    if (queryType === 'institution' || queryType === 'dean') return 'institution';
    return 'student';
  });

  // University Academic Fields
  const { universities } = useJharkhandUniversities();
  const [selectedUnivId, setSelectedUnivId] = useState<string>('nitjsr');
  const [customUnivName, setCustomUnivName] = useState('');
  const [department, setDepartment] = useState<string>('');
  const [customDepartment, setCustomDepartment] = useState('');

  // Institution departments management state (saved directly to MongoDB)
  const [institutionDepartments, setInstitutionDepartments] = useState<string[]>([]);
  const [newDeptInput, setNewDeptInput] = useState('');
  const [isSavingDepts, setIsSavingDepts] = useState(false);
  const [deptSaveStatus, setDeptSaveStatus] = useState<string | null>(null);

  // Student-specific fields
  const [rollNumber, setRollNumber] = useState('');
  const [academicYear, setAcademicYear] = useState('3rd Year (6th Semester)');
  const [apaarId, setApaarId] = useState('');
  const [researchInterest, setResearchInterest] = useState('');

  // Mentor-specific fields
  const [facultyDesignation, setFacultyDesignation] = useState('Associate Professor');
  const [facultyId, setFacultyId] = useState('');
  const [vidwanId, setVidwanId] = useState('');
  const [researchLab, setResearchLab] = useState('');

  // Institutional Admin-specific fields
  const [adminDesignation, setAdminDesignation] = useState('Dean (R&D)');
  const [aisheCodeInput, setAisheCodeInput] = useState('U-0205');
  const [nodalOrderRef, setNodalOrderRef] = useState('');

  // Industry-specific fields
  const [corporateCin, setCorporateCin] = useState('');
  const [corporateDesignation, setCorporateDesignation] = useState('CSR Head / Nodal Manager');

  // Government-specific fields
  const [govDesignation, setGovDesignation] = useState('State Nodal Officer');
  const [govDepartment, setGovDepartment] = useState('Department of Health');

  // Personal Info
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Geographic Info
  const [pincode, setPincode] = useState('');
  const [district, setDistrict] = useState('Ranchi');
  const [taluka, setTaluka] = useState('Kanke');
  const [customTaluka, setCustomTaluka] = useState('');
  const [villageOrCity, setVillageOrCity] = useState('');
  const [customVillage, setCustomVillage] = useState('');

  // India Post Auto-detect State
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeFeedback, setPincodeFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [localities, setLocalities] = useState<string[]>([]);

  // Organization (for general fallback or industry)
  const [organization, setOrganization] = useState('');

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync state if URL query params change
  useEffect(() => {
    if (isCitizenOnly) {
      setRole('citizen');
    } else if (isUniversityOnly) {
      setRole('university');
    } else if (isIndustryOnly) {
      setRole('industry');
    } else if (queryRole === 'university') {
      setRole('university');
    } else if (queryRole === 'industry') {
      setRole('industry');
    } else if (isGovernmentOnly || queryRole === 'government') {
      setRole('government');
    } else if (queryRole === 'citizen') {
      setRole('citizen');
    }

    if (queryType === 'state') setGovSubRole('state');
    else if (queryType === 'district') setGovSubRole('district');
    else if (queryType === 'department') setGovSubRole('department');

    if (queryType === 'mentor') setUnivSubRole('mentor');
    else if (queryType === 'institution' || queryType === 'dean') setUnivSubRole('institution');
    else if (queryType === 'student') setUnivSubRole('student');
  }, [queryRole, queryType, isCitizenOnly, isUniversityOnly, isIndustryOnly, isGovernmentOnly]);

  // When university is selected, auto-update campus location, AISHE code, and existing departments
  useEffect(() => {
    if (role === 'university' && selectedUnivId !== '__other__') {
      const u = universities.find((x) => x.id === selectedUnivId) || getUniversityById(selectedUnivId);
      if (u) {
        setDistrict(u.district);
        setPincode(u.pincode || '');
        setVillageOrCity(u.city);
        setAisheCodeInput(u.aisheCode || '');
        const existingDepts = Array.isArray(u.departments) ? u.departments : [];
        setInstitutionDepartments(existingDepts);
        if (existingDepts.length > 0 && existingDepts[0]) {
          setDepartment(existingDepts[0]);
        } else {
          setDepartment('');
        }
      }
    }
  }, [role, selectedUnivId, universities]);

  const handleAddDepartment = async () => {
    const trimmed = newDeptInput.trim();
    if (!trimmed) return;
    if (institutionDepartments.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      setNewDeptInput('');
      return;
    }
    const updated = [...institutionDepartments, trimmed];
    setInstitutionDepartments(updated);
    setNewDeptInput('');

    // If a known institution is selected, save directly to MongoDB immediately
    if (selectedUnivId && selectedUnivId !== '__other__') {
      try {
        setIsSavingDepts(true);
        await saveUniversityDepartmentsToDb(selectedUnivId, updated, 'replace');
        setDeptSaveStatus('✓ Saved directly to MongoDB Atlas');
        setTimeout(() => setDeptSaveStatus(null), 3000);
      } catch {
        setDeptSaveStatus('Saved locally (will sync on registration)');
      } finally {
        setIsSavingDepts(false);
      }
    }
  };

  const handleRemoveDepartment = async (deptToRemove: string) => {
    const updated = institutionDepartments.filter((d) => d !== deptToRemove);
    setInstitutionDepartments(updated);
    if (selectedUnivId && selectedUnivId !== '__other__') {
      try {
        setIsSavingDepts(true);
        await saveUniversityDepartmentsToDb(selectedUnivId, updated, 'replace');
        setDeptSaveStatus('✓ Updated in MongoDB Atlas');
        setTimeout(() => setDeptSaveStatus(null), 3000);
      } catch {
        // ignore
      } finally {
        setIsSavingDepts(false);
      }
    }
  };

  const handleSaveDepartmentsNow = async () => {
    if (institutionDepartments.length === 0) return;
    try {
      setIsSavingDepts(true);
      const targetId = selectedUnivId === '__other__' ? customUnivName.trim() : selectedUnivId;
      if (targetId) {
        await saveUniversityDepartmentsToDb(targetId, institutionDepartments, 'replace');
        setDeptSaveStatus('✓ All departments saved directly to MongoDB Atlas!');
        setTimeout(() => setDeptSaveStatus(null), 4000);
      }
    } catch {
      setDeptSaveStatus('Error saving to MongoDB');
    } finally {
      setIsSavingDepts(false);
    }
  };

  // Get official LGD blocks for currently selected district
  const availableBlocks = useMemo(() => {
    return getBlocksForDistrict(district);
  }, [district]);

  // Selected LGD District & Block objects
  const selectedDistrictObj = useMemo(() => {
    return getDistrictByName(district) || JHARKHAND_DISTRICTS[0];
  }, [district]);

  const selectedBlockObj = useMemo(() => {
    return availableBlocks.find(
      (b) => b.name.toLowerCase() === taluka.trim().toLowerCase(),
    );
  }, [availableBlocks, taluka]);

  // Available Gram Panchayats / Wards for selected Block
  const availableVillages = useMemo(() => {
    if (taluka === '__other__' || !taluka) return [];
    return getVillagesForBlock(taluka);
  }, [taluka]);

  // Selected Village / Ward object
  const selectedVillageObj = useMemo(() => {
    return availableVillages.find(
      (v) => v.name.toLowerCase() === villageOrCity.trim().toLowerCase(),
    );
  }, [availableVillages, villageOrCity]);

  // Keep taluka valid when district changes
  useEffect(() => {
    if (taluka === '__other__') return;
    const exists = availableBlocks.some(
      (b) => b.name.toLowerCase() === taluka.trim().toLowerCase(),
    );
    if (!exists && availableBlocks.length > 0 && availableBlocks[0]) {
      setTaluka(availableBlocks[0].name);
    }
  }, [district, availableBlocks, taluka]);

  // Keep village valid when block changes
  useEffect(() => {
    if (villageOrCity === '__custom__') return;
    if (availableVillages.length > 0) {
      const existsInVillages = availableVillages.some(
        (v) => v.name.toLowerCase() === villageOrCity.trim().toLowerCase(),
      );
      const existsInLocalities = localities.some(
        (l) => l.toLowerCase() === villageOrCity.trim().toLowerCase(),
      );
      if (!existsInVillages && !existsInLocalities && availableVillages[0]) {
        setVillageOrCity(availableVillages[0].name);
      }
    }
  }, [availableVillages, localities, villageOrCity]);

  // Validate Indian Phone Number: 10 digits starting with 6, 7, 8, or 9
  const validatePhone = (num: string) => {
    const cleaned = num.replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(cleaned);
  };

  // Indian Postal Pincode Auto-Detection
  const handlePincodeLookup = async (pinToLookup: string) => {
    const cleanedPin = pinToLookup.trim().replace(/\D/g, '');
    if (cleanedPin.length !== 6) return;

    setPincodeLoading(true);
    setPincodeFeedback(null);

    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${cleanedPin}`,
      );
      const data = await response.json();

      if (
        Array.isArray(data) &&
        data[0]?.Status === 'Success' &&
        Array.isArray(data[0]?.PostOffice) &&
        data[0].PostOffice.length > 0
      ) {
        const poList: PostalPostOffice[] = data[0].PostOffice;
        const postOffice = poList[0];
        if (!postOffice) return;

        // Extract localities for dropdown
        const uniqueLocalities = Array.from(
          new Set(poList.map((po) => po.Name)),
        );
        setLocalities(uniqueLocalities);

        // Try to match District in Jharkhand LGD
        const poDistrict = postOffice.District || '';
        const poBlock = postOffice.Block || '';

        const matchedDist = JHARKHAND_DISTRICTS.find(
          (d) =>
            d.name.toLowerCase() === poDistrict.toLowerCase() ||
            poDistrict.toLowerCase().includes(d.name.toLowerCase()) ||
            d.name.toLowerCase().includes(poDistrict.toLowerCase()),
        );

        if (matchedDist) {
          setDistrict(matchedDist.name);

          // Try to match block
          const distBlocks = getBlocksForDistrict(matchedDist.code);
          const matchedBlk = distBlocks.find(
            (b) =>
              b.name.toLowerCase() === poBlock.toLowerCase() ||
              poBlock.toLowerCase().includes(b.name.toLowerCase()) ||
              b.name.toLowerCase().includes(poBlock.toLowerCase()),
          );

          if (matchedBlk) {
            setTaluka(matchedBlk.name);
          }

          // Auto-select first locality/village from India Post
          const firstLoc = uniqueLocalities[0];
          if (firstLoc) {
            setVillageOrCity(firstLoc);
          }

          setPincodeFeedback({
            type: 'success',
            text: `✓ India Post Verified: ${poDistrict} (${uniqueLocalities.length} localities found)`,
          });
        } else {
          setPincodeFeedback({
            type: 'success',
            text: `✓ India Post: Found ${poDistrict} (${uniqueLocalities.length} localities)`,
          });
        }
      } else {
        setPincodeFeedback({
          type: 'error',
          text: 'Pincode not found in India Post directory. You can select details from the dropdowns.',
        });
      }
    } catch {
      setPincodeFeedback({
        type: 'error',
        text: 'Postal service lookup offline. You can select District, Block & Village manually.',
      });
    } finally {
      setPincodeLoading(false);
    }
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincode(val);
    if (val.length === 6) {
      handlePincodeLookup(val);
    } else {
      setPincodeFeedback(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Phone number validation
    const cleanedPhone = phone.replace(/\D/g, '');
    if (!validatePhone(cleanedPhone)) {
      setError(
        'Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).',
      );
      return;
    }

    // 2. Password match check
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    // 3. Citizen-specific geographic validations
    const effectiveTaluka = taluka === '__other__' ? customTaluka.trim() : taluka.trim();
    const effectiveVillage = villageOrCity === '__custom__' ? customVillage.trim() : villageOrCity.trim();

    if (role === 'citizen') {
      if (pincode && !/^\d{6}$/.test(pincode.trim())) {
        setError('Please enter a valid 6-digit postal pincode.');
        return;
      }
      if (!effectiveTaluka) {
        setError('Please select or specify your Taluka / Block.');
        return;
      }
      if (!effectiveVillage) {
        setError('Please select or specify your City / Village / Ward.');
        return;
      }
    }

    // 4. Resolve university institutional organization string
    let finalOrg = organization.trim();
    const effectiveUnivName =
      selectedUnivId === '__other__'
        ? customUnivName.trim() || 'Affiliated Institution'
        : (universities.find((u) => u.id === selectedUnivId)?.name || getUniversityById(selectedUnivId)?.name || 'NIT Jamshedpur');
    const effectiveDept =
      univSubRole === 'institution'
        ? (institutionDepartments.join(', ') || 'All Departments')
        : (department === '__other__' ? customDepartment.trim() || 'General' : (department || customDepartment.trim() || 'General'));

    if (role === 'university') {
      if (univSubRole === 'student') {
        finalOrg = `${effectiveUnivName} | Dept: ${effectiveDept} | Role: Student (${rollNumber.trim() || 'Enrolled'})`;
      } else if (univSubRole === 'mentor') {
        finalOrg = `${effectiveUnivName} | Dept: ${effectiveDept} | Role: Faculty Mentor (${facultyDesignation}${facultyId ? `, ID: ${facultyId.trim()}` : ''})`;
      } else {
        finalOrg = `${effectiveUnivName} | Role: Institutional Admin (${adminDesignation}, AISHE: ${aisheCodeInput.trim() || 'U-0205'})`;
      }
    } else if (role === 'industry') {
      finalOrg = `${organization.trim() || 'Industry Partner'} | Role: ${corporateDesignation} ${corporateCin ? `(CIN: ${corporateCin.trim()})` : ''}`;
    } else if (role === 'government') {
      if (govSubRole === 'state') {
        finalOrg = `Government of Jharkhand | Role: ${govDesignation}`;
      } else if (govSubRole === 'district') {
        finalOrg = `District Administration, ${district} | Role: ${govDesignation}`;
      } else {
        finalOrg = `${govDepartment} | Role: ${govDesignation}`;
      }
    }

    // 5. Validate with shared Zod schema
    const parsed = registerRequestSchema.safeParse({
      full_name: fullName.trim(),
      email: email.trim(),
      password,
      role,
      organization: finalOrg || undefined,
      phone: cleanedPhone,
      district: district || undefined,
      taluka: effectiveTaluka || undefined,
      village_or_city: effectiveVillage || undefined,
      pincode: pincode.trim() || undefined,
      lgd_district_code: selectedDistrictObj?.code,
      lgd_block_code: selectedBlockObj?.code,
    });

    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? 'Invalid registration details',
      );
      return;
    }

    setLoading(true);
    try {
      // Directly persist university departments to MongoDB Atlas
      if (role === 'university') {
        const targetId =
          selectedUnivId === '__other__'
            ? customUnivName.trim() || effectiveUnivName
            : selectedUnivId;

        if (univSubRole === 'institution' && institutionDepartments.length > 0 && targetId) {
          try {
            await saveUniversityDepartmentsToDb(targetId, institutionDepartments, 'replace', {
              name: effectiveUnivName,
              district: district || 'Ranchi',
              aishe_code: aisheCodeInput.trim() || undefined,
            });
          } catch (e) {
            console.warn('Direct MongoDB save warning during registration:', e);
          }
        } else if (
          (univSubRole === 'student' || univSubRole === 'mentor') &&
          effectiveDept &&
          effectiveDept !== 'General' &&
          targetId
        ) {
          try {
            await saveUniversityDepartmentsToDb(targetId, [effectiveDept], 'add', {
              name: effectiveUnivName,
              district: district || 'Ranchi',
            });
          } catch {
            // non-fatal
          }
        }
      }

      const payload: Record<string, unknown> = {
        ...parsed.data,
        departments: univSubRole === 'institution' ? institutionDepartments : (effectiveDept ? [effectiveDept] : []),
        university_code: selectedUnivId !== '__other__' ? selectedUnivId : undefined,
        university_name: effectiveUnivName,
      };

      // Only include geographic info for citizens or district-level government officials
      if (role === 'citizen' || (role === 'government' && govSubRole === 'district')) {
        if (selectedDistrictObj) {
          payload.district = selectedDistrictObj.name;
        }
        
        if (role === 'citizen') {
          payload.taluka = effectiveTaluka;
          payload.village_or_city = effectiveVillage;
          payload.pincode = pincode.trim();
          payload.lgd_district_code = selectedDistrictObj?.code;
          payload.lgd_block_code = selectedBlockObj?.code;
        }
      }

      const res = await apiClient.post('/auth/register', payload);
      setSession(res.data.user, res.data.token);

      // Save client profile details in localStorage for enriched dashboard experience
      if (role === 'university') {
        try {
          localStorage.setItem(
            'samadhansetu_university_profile',
            JSON.stringify({
              univId: selectedUnivId,
              univName: effectiveUnivName,
              subRole: univSubRole,
              department: effectiveDept,
              rollNumber,
              facultyId,
              designation: univSubRole === 'mentor' ? facultyDesignation : adminDesignation,
            }),
          );
        } catch {
          // ignore localStorage failure
        }
      }

      // Smart role-based redirect
      if (role === 'citizen' || role === 'government') {
        if (role === 'government') {
          navigate('/government');
        } else if (queryFor === 'submit') {
          navigate('/submit');
        } else {
          navigate('/dashboard');
        }
      } else if (role === 'university') {
        if (univSubRole === 'student') {
          navigate('/student');
        } else if (univSubRole === 'mentor') {
          navigate('/university/mentor');
        } else {
          navigate('/university');
        }
      } else if (role === 'industry') {
        navigate('/industry');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          'Could not create account. Email may already be in use.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-8 px-4">
      <div className="bg-white border-2 border-navy rounded-[2px] p-6 sm:p-8 shadow-sm">
        {/* Header Badge */}
        <div className="border-b border-border pb-4 mb-6">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-forest uppercase font-bold tracking-wider">
              {isCitizenOnly
                ? 'झारखंड सरकार · नागरिक पंजीकरण (NIC & LGD Integrated)'
                : isUniversityOnly
                  ? 'झारखंड सरकार · उच्च एवं तकनीकी शिक्षा विभाग'
                  : isIndustryOnly
                    ? 'झारखंड सरकार · उद्योग एवं सीएसआर सहभागिता'
                    : 'झारखंड सरकार · नागरिक एवं संस्था पंजीकरण (NIC & LGD Integrated)'}
            </span>
            <span className="text-[10px] font-mono bg-paper px-2 py-0.5 border border-border text-ink-muted">
              {isCitizenOnly
                ? 'CITIZEN ACCESS'
                : isUniversityOnly
                  ? 'UNIVERSITY ECOSYSTEM · NEP 2020'
                  : isIndustryOnly
                    ? 'INDUSTRY & CSR PARTNER'
                    : 'NEP 2020 / AISHE'}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy mt-1">
            {isCitizenOnly
              ? 'Citizen Registration / नागरिक पंजीकरण'
              : isUniversityOnly
                ? 'University Stakeholder Registration / विश्वविद्यालय पंजीकरण'
                : isIndustryOnly
                  ? 'Corporate & CSR Partner Registration / उद्योग पंजीकरण'
                  : 'Stakeholder Registration / पंजीकरण'}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            {isCitizenOnly
              ? 'Register with your verified mobile number and Jharkhand LGD block to report civic issues and track resolution.'
              : isUniversityOnly
                ? 'Register under your university node as a Student Innovator, Faculty Mentor, or Institution Node.'
                : isIndustryOnly
                  ? 'Register your corporate entity, foundation, or PSU to sponsor student innovations and fund civic problem-solving pipelines.'
                  : 'Official portal to crowdsource societal challenges, civic grievances, and university-industry innovation pipelines.'}
          </p>
        </div>

        {/* ROLE SELECTOR TABS (Only shown if NOT in citizen-only, university-only, or industry-only mode) */}
        {!isCitizenOnly && !isUniversityOnly && !isIndustryOnly && (
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2 font-mono">
              Select Account Type / खाता प्रकार चुनें
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('citizen')}
                className={`p-3 text-xs font-bold rounded-[2px] border transition-colors text-center ${
                  role === 'citizen'
                    ? 'bg-navy text-white border-navy shadow-sm'
                    : 'bg-paper text-ink border-border hover:border-navy'
                }`}
              >
                <div className="text-sm mb-0.5">👥 Citizen</div>
                <div className="text-[10px] font-normal opacity-85">
                  नागरिक / जन प्रतिनिधि
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('university')}
                className={`p-3 text-xs font-bold rounded-[2px] border transition-colors text-center ${
                  role === 'university'
                    ? 'bg-forest text-white border-forest shadow-sm'
                    : 'bg-paper text-ink border-border hover:border-forest'
                }`}
              >
                <div className="text-sm mb-0.5">🎓 University</div>
                <div className="text-[10px] font-normal opacity-85">
                  छात्र · संरक्षक · संस्थान
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('industry')}
                className={`p-3 text-xs font-bold rounded-[2px] border transition-colors text-center ${
                  role === 'industry'
                    ? 'bg-navy text-white border-navy shadow-sm'
                    : 'bg-paper text-ink border-border hover:border-navy'
                }`}
              >
                <div className="text-sm mb-0.5">💼 Industry / CSR</div>
                <div className="text-[10px] font-normal opacity-85">
                  उद्योग / सीएसआर पार्टनर
                </div>
              </button>
            </div>
          </div>
        )}

        {/* UNIVERSITY SPECIFIC SUB-ROLE TABS */}
        {role === 'university' && (
          <div className="mb-6 p-4 bg-forest/10 border-2 border-forest/40 rounded-[2px]">
            <label className="block text-xs font-bold uppercase tracking-wider text-forest mb-2 font-mono">
              University Ecosystem Role / विश्वविद्यालय संवर्ग चुनें
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setUnivSubRole('student')}
                className={`p-2.5 text-left rounded-[2px] border transition-colors ${
                  univSubRole === 'student'
                    ? 'bg-white border-forest shadow-sm text-forest'
                    : 'bg-paper/80 border-border hover:border-forest text-ink'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  <span>👨‍🎓 Student Innovator</span>
                </div>
                <div className="text-[10px] text-ink-muted mt-0.5">
                  Undergrad / Postgrad Team Researcher
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUnivSubRole('mentor')}
                className={`p-2.5 text-left rounded-[2px] border transition-colors ${
                  univSubRole === 'mentor'
                    ? 'bg-white border-forest shadow-sm text-forest'
                    : 'bg-paper/80 border-border hover:border-forest text-ink'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  <span>👨‍🏫 Faculty Mentor</span>
                </div>
                <div className="text-[10px] text-ink-muted mt-0.5">
                  Professor / Guide / Principal Investigator
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUnivSubRole('institution')}
                className={`p-2.5 text-left rounded-[2px] border transition-colors ${
                  univSubRole === 'institution'
                    ? 'bg-white border-forest shadow-sm text-forest'
                    : 'bg-paper/80 border-border hover:border-forest text-ink'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  <span>🏛️ Institution Node</span>
                </div>
                <div className="text-[10px] text-ink-muted mt-0.5">
                  Dean R&amp;D / Registrar / Nodal Officer
                </div>
              </button>
            </div>
          </div>
        )}

        {/* REGISTRATION FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* SECTION 1: Personal & Contact Information */}
          <div className="border border-border p-4 bg-paper/50 rounded-[2px]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-forest border-b border-border pb-1.5 mb-3 flex items-center gap-1.5 font-mono">
              <span className="material-symbols-outlined text-base">person</span>
              <span>
                1. Personal &amp; Identity Details / व्यक्तिगत विवरण
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Full Name / पूरा नाम <span className="text-urgent">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    role === 'university' && univSubRole === 'mentor'
                      ? 'e.g. Dr. Rajesh Sharma'
                      : role === 'university' && univSubRole === 'student'
                        ? 'e.g. Himmat Singh'
                        : 'e.g. Ramesh Kumar Soren'
                  }
                  className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-navy"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Mobile Number / मोबाइल नंबर <span className="text-urgent">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-2.5 rounded-l-[2px] border border-r-0 border-border bg-paper text-xs font-mono text-ink-muted">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    className="w-full rounded-r-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-navy font-mono"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, ''))
                    }
                  />
                </div>
                <span className="text-[10px] text-ink-muted mt-0.5 block">
                  10-digit Indian mobile number for SMS OTP alerts.
                </span>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Email Address / ईमेल पता <span className="text-urgent">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder={
                    role === 'university'
                      ? 'e.g. scholar@nitjsr.ac.in'
                      : 'e.g. user@example.com'
                  }
                  className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-navy"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {role === 'university' && (
                  <span className="text-[10px] text-forest mt-0.5 block font-mono">
                    Use institutional domain for fast auto-verification.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2A: UNIVERSITY ACADEMIC PROFILE (When University Role is Selected) */}
          {role === 'university' && (
            <div className="border border-forest/40 p-4 bg-paper/60 rounded-[2px] space-y-4">
              <div className="border-b border-border pb-1.5 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-1.5 font-mono">
                  <span className="material-symbols-outlined text-base">school</span>
                  <span>
                    2. University &amp; Academic Affiliation / शैक्षणिक विवरण
                  </span>
                </h2>
                <span className="text-[10px] font-mono bg-forest/10 px-2 py-0.5 text-forest font-bold rounded-[2px]">
                  {univSubRole.toUpperCase()} DESK
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* University Selection */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                    Select University / Institution / विश्वविद्यालय चुनें <span className="text-urgent">*</span>
                  </label>
                  <select
                    value={selectedUnivId}
                    onChange={(e) => setSelectedUnivId(e.target.value)}
                    className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-forest"
                  >
                    <optgroup label="Premier Institutes & State Universities (विश्वविद्यालय)">
                      {universities.filter(
                        (u) =>
                          u.category === 'Institute of National Importance' ||
                          u.category === 'Central University' ||
                          u.category === 'State University' ||
                          u.category === 'Deemed University-Private'
                      ).map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.city})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Government Engineering Colleges (राजकीय इंजीनियरिंग कॉलेज)">
                      {universities.filter((u) => u.category === 'Govt Engineering').map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.city})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Constituent Colleges (अंगीभूत महाविद्यालय)">
                      {universities.filter((u) => u.category === 'Constituent Colleges').map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.city})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Affiliated Colleges (संबद्ध महाविद्यालय)">
                      {universities.filter((u) => u.category === 'Affiliated Colleges').map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.city})
                        </option>
                      ))}
                    </optgroup>
                    <option value="__other__">Other Affiliated College / Polytechnic Institute…</option>
                  </select>

                  {selectedUnivId === '__other__' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        required
                        placeholder="Enter full name of your college or university"
                        className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-forest"
                        value={customUnivName}
                        onChange={(e) => setCustomUnivName(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* INSTITUTION ROLE: Direct Department Input & MongoDB Management */}
                {univSubRole === 'institution' ? (
                  <div className="sm:col-span-2 bg-paper border border-border p-3.5 rounded-[2px] shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-ink">
                          University Academic Departments / विश्वविद्यालय के विभाग जोड़ें <span className="text-urgent">*</span>
                        </label>
                        <p className="text-[11px] text-ink-muted">
                          Enter official academic departments/faculties for this institution. These save directly to MongoDB Atlas.
                        </p>
                      </div>
                      {institutionDepartments.length > 0 && (
                        <button
                          type="button"
                          onClick={handleSaveDepartmentsNow}
                          disabled={isSavingDepts}
                          className="px-2.5 py-1 bg-forest text-white text-[11px] font-bold rounded-[2px] hover:bg-forest-deep transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <span>💾</span>
                          <span>{isSavingDepts ? 'Saving…' : 'Save to MongoDB Now'}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2 mb-2.5">
                      <input
                        type="text"
                        placeholder="Type department name (e.g. Department of Computer Science, Civil Engineering, Botany)"
                        className="flex-1 rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-forest"
                        value={newDeptInput}
                        onChange={(e) => setNewDeptInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddDepartment();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddDepartment}
                        className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-[2px] hover:bg-navy-deep transition-colors uppercase tracking-wider cursor-pointer"
                      >
                        + Add Department
                      </button>
                    </div>

                    {institutionDepartments.length === 0 ? (
                      <div className="text-xs text-ink-muted italic py-3 px-3 bg-white border border-dashed border-border text-center rounded-[2px]">
                        No departments added yet. Type a department name above and click "+ Add Department" to save directly to MongoDB.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                          {institutionDepartments.map((dept, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-navy text-xs font-medium border border-border shadow-xs rounded-[2px]"
                            >
                              <span>🏢 {dept}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveDepartment(dept)}
                                className="text-urgent hover:text-red-700 font-bold ml-1 text-sm leading-none cursor-pointer"
                                title="Remove department"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-ink-muted px-1">
                          <span>{institutionDepartments.length} department(s) configured</span>
                          {deptSaveStatus && (
                            <span className="text-forest font-semibold animate-pulse">{deptSaveStatus}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* STUDENT & MENTOR: Department Selection or Direct Input */
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                      Department / संकाय <span className="text-urgent">*</span>
                    </label>
                    {institutionDepartments.length > 0 ? (
                      <>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-forest"
                        >
                          {institutionDepartments.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                          <option value="__other__">Other Department / Custom…</option>
                        </select>

                        {department === '__other__' && (
                          <div className="mt-2">
                            <input
                              type="text"
                              required
                              placeholder="Enter your specific department name"
                              className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-forest"
                              value={customDepartment}
                              onChange={(e) => setCustomDepartment(e.target.value)}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Enter your department name (e.g. Computer Science, Civil Engineering, Physics)"
                          className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-forest"
                          value={customDepartment || department}
                          onChange={(e) => {
                            setCustomDepartment(e.target.value);
                            setDepartment(e.target.value);
                          }}
                        />
                        <p className="mt-1 text-[10px] text-ink-muted">
                          Enter your department at {selectedUnivId === '__other__' ? (customUnivName || 'your university') : (getUniversityById(selectedUnivId)?.shortName || 'your university')}.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* STUDENT SPECIFIC FIELDS */}
                {univSubRole === 'student' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                        Student Roll No. / Enrollment ID <span className="text-urgent">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 2022UGCS045"
                        className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-forest font-mono uppercase"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                        Current Academic Year / Semester <span className="text-urgent">*</span>
                      </label>
                      <select
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-forest"
                      >
                        <option value="1st Year (1st/2nd Sem)">1st Year (1st/2nd Sem)</option>
                        <option value="2nd Year (3rd/4th Sem)">2nd Year (3rd/4th Sem)</option>
                        <option value="3rd Year (6th Semester)">3rd Year (5th/6th Sem)</option>
                        <option value="4th Year (7th/8th Sem)">4th Year (7th/8th Sem)</option>
                        <option value="Postgraduate / M.Tech">Postgraduate / M.Tech</option>
                        <option value="Ph.D. Scholar">Ph.D. Scholar</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                        APAAR ID / ABC ID (Optional - NEP 2020)
                      </label>
                      <input
                        type="text"
                        maxLength={12}
                        placeholder="12-digit Academic Bank of Credits ID"
                        className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-forest font-mono"
                        value={apaarId}
                        onChange={(e) => setApaarId(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                        Innovation Team / Topic Focus
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Namkum Water Telemetry Team"
                        className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-forest"
                        value={researchInterest}
                        onChange={(e) => setResearchInterest(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* MENTOR SPECIFIC FIELDS */}
                {univSubRole === 'mentor' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                        Faculty Designation <span className="text-urgent">*</span>
                      </label>
                      <select
                        value={facultyDesignation}
                        onChange={(e) => setFacultyDesignation(e.target.value)}
                        className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-forest"
                      >
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Professor">Professor</option>
                        <option value="Head of Department (HOD)">Head of Department (HOD)</option>
                        <option value="Dean / Director">Dean / Director</option>
                        <option value="Visiting Research Guide">Visiting Research Guide</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                        Faculty Employee ID / कोड <span className="text-urgent">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. FAC-CSE-108"
                        className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-forest font-mono uppercase"
                        value={facultyId}
                        onChange={(e) => setFacultyId(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                        Vidwan / ORCID ID (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. VIDWAN-948102"
                        className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-forest font-mono"
                        value={vidwanId}
                        onChange={(e) => setVidwanId(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                        Research Lab / CoE Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. IoT &amp; Environmental Sensing Lab"
                        className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-forest"
                        value={researchLab}
                        onChange={(e) => setResearchLab(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* INSTITUTIONAL ADMIN SPECIFIC FIELDS */}
                {univSubRole === 'institution' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                        Administrative Designation <span className="text-urgent">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dean (Research &amp; Consultancy)"
                        className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-forest"
                        value={adminDesignation}
                        onChange={(e) => setAdminDesignation(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                        Institutional AISHE Code <span className="text-urgent">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. U-0205"
                        className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-forest font-mono"
                        value={aisheCodeInput}
                        onChange={(e) => setAisheCodeInput(e.target.value)}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                        Nodal Order / Registrar Authorisation Ref
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. NITJSR/RD/2026/ORD-412"
                        className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-forest font-mono"
                        value={nodalOrderRef}
                        onChange={(e) => setNodalOrderRef(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2B: INDUSTRY / CSR PROFILE */}
          {role === 'industry' && (
            <div className="border border-border p-4 bg-paper/50 rounded-[2px] space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest border-b border-border pb-1.5 mb-3 flex items-center gap-1.5 font-mono">
                <span className="material-symbols-outlined text-base">business</span>
                <span>2. Corporate &amp; CSR Partnership Profile / कॉर्पोरेट विवरण</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                    Company / CSR Entity Name <span className="text-urgent">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Steel Foundation CSR / Central Coalfields Limited"
                    className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-navy"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                    Corporate CIN or CSR Reg No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. L27100MH1907PLC000260"
                    className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-navy font-mono"
                    value={corporateCin}
                    onChange={(e) => setCorporateCin(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                    Designation / Role in Entity <span className="text-urgent">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead - Tribal Development &amp; Rural R&amp;D"
                    className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-navy"
                    value={corporateDesignation}
                    onChange={(e) => setCorporateDesignation(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2D: GOVERNMENT PROFILE */}
          {role === 'government' && (
            <div className="border border-border p-4 bg-paper/50 rounded-[2px] space-y-4 mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-turmeric-deep border-b border-border pb-1.5 mb-3 flex items-center gap-1.5 font-mono">
                <span className="material-symbols-outlined text-base">account_balance</span>
                <span>2. Government / State Official Profile</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                    Designation / पदनाम <span className="text-urgent">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={govSubRole === 'district' ? 'e.g. Deputy Commissioner' : 'e.g. Nodal Officer / Secretary'}
                    className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-turmeric-deep"
                    value={govDesignation}
                    onChange={(e) => setGovDesignation(e.target.value)}
                  />
                </div>

                {govSubRole === 'district' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                      Select District <span className="text-urgent">*</span>
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-turmeric-deep"
                    >
                      {JHARKHAND_DISTRICTS.map((dist) => (
                        <option key={dist.code} value={dist.name}>
                          {dist.name} (LGD: {dist.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(govSubRole === 'department' || govSubRole === 'state') && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                      Department Name <span className="text-urgent">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Department of Health and Family Welfare"
                      className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-turmeric-deep"
                      value={govDepartment}
                      onChange={(e) => setGovDepartment(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2C: CITIZEN GEOGRAPHIC & LGD DETAILS (For Citizens) */}
          {role === 'citizen' && (
            <div className="border border-border p-4 bg-paper/50 rounded-[2px]">
              <div className="border-b border-border pb-1.5 mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-1.5 font-mono">
                  <span className="material-symbols-outlined text-base">location_on</span>
                  <span>
                    2. Geographic &amp; Residential Location / झारखंड LGD प्रशासनिक विवरण
                  </span>
                </h2>

                <div className="text-[10px] font-mono bg-paper-dark px-2 py-0.5 border border-border rounded-[2px] text-ink-muted">
                  State: Jharkhand (Code 20)
                  {selectedDistrictObj && ` · Dist LGD: ${selectedDistrictObj.code}`}
                  {selectedBlockObj && ` · Blk LGD: ${selectedBlockObj.code}`}
                  {selectedVillageObj && ` · GP/Ward: ${selectedVillageObj.code}`}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Postal Pincode with Auto-Detect */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
                      Postal Pincode / पिन कोड <span className="text-urgent">*</span>
                    </label>
                    <span className="text-[10px] text-forest font-mono">
                      ⚡ Auto-fills District, Block &amp; Village Dropdowns via India Post
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Enter 6-digit Pincode (e.g. 834001, 827001)"
                      className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-navy font-mono"
                      value={pincode}
                      onChange={handlePincodeChange}
                    />
                    <button
                      type="button"
                      disabled={pincodeLoading || pincode.length !== 6}
                      onClick={() => handlePincodeLookup(pincode)}
                      className="px-3 py-2 text-xs font-bold bg-paper border border-border hover:border-navy text-navy rounded-[2px] whitespace-nowrap disabled:opacity-50"
                    >
                      {pincodeLoading ? 'Checking...' : 'Lookup PIN'}
                    </button>
                  </div>

                  {/* Pincode Feedback Message */}
                  {pincodeFeedback && (
                    <div
                      className={`mt-1.5 text-[11px] font-mono flex items-center gap-1 ${
                        pincodeFeedback.type === 'success'
                          ? 'text-forest font-bold'
                          : 'text-urgent'
                      }`}
                    >
                      <span>{pincodeFeedback.text}</span>
                    </div>
                  )}
                </div>

                {/* District Dropdown (24 Official LGD Districts) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                    District / जिला (LGD 24 Districts) <span className="text-urgent">*</span>
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-navy"
                  >
                    {JHARKHAND_DISTRICTS.map((d) => (
                      <option key={d.code} value={d.name}>
                        {d.name} ({d.nameLocal}) · Code: {d.code}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Block / Taluka Dropdown */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                    Taluka / Block / प्रखंड (LGD) <span className="text-urgent">*</span>
                  </label>
                  <select
                    value={taluka}
                    onChange={(e) => setTaluka(e.target.value)}
                    className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-navy"
                  >
                    {availableBlocks.map((b) => (
                      <option key={b.code} value={b.name}>
                        {b.name} · LGD: {b.code}
                      </option>
                    ))}
                    <option value="__other__">Other / Block not listed…</option>
                  </select>
                </div>

                {taluka === '__other__' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                      Specify Taluka / Block Name <span className="text-urgent">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sonahatu"
                      className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-navy"
                      value={customTaluka}
                      onChange={(e) => setCustomTaluka(e.target.value)}
                    />
                  </div>
                )}

                {/* Village / Gram Panchayat / Ward Selection */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                    City / Gram Panchayat / Ward / गाँव / पंचायत <span className="text-urgent">*</span>
                  </label>

                  {localities.length > 0 ? (
                    <div className="space-y-2">
                      <select
                        value={villageOrCity}
                        onChange={(e) => setVillageOrCity(e.target.value)}
                        className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-navy font-mono"
                      >
                        <optgroup label="── Localities from India Post PIN Lookup ──">
                          {localities.map((loc) => (
                            <option key={`po-${loc}`} value={loc}>
                              📮 {loc}
                            </option>
                          ))}
                        </optgroup>
                        {availableVillages.length > 0 && (
                          <optgroup label="── Official LGD Gram Panchayats ──">
                            {availableVillages.map((v) => (
                              <option key={`lgd-${v.code}`} value={v.name}>
                                🏛️ {v.name} ({v.type})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <option value="__custom__">Type a custom Village / Tola / Locality…</option>
                      </select>
                    </div>
                  ) : availableVillages.length > 0 ? (
                    <select
                      value={villageOrCity}
                      onChange={(e) => setVillageOrCity(e.target.value)}
                      className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-navy"
                    >
                      {availableVillages.map((v) => (
                        <option key={v.code} value={v.name}>
                          {v.name} ({v.type}) · LGD: {v.code}
                        </option>
                      ))}
                      <option value="__custom__">Other Village / Mohalla / Custom Tola…</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Morabadi / Kanke Village / Ward 4"
                      className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-navy"
                      value={villageOrCity}
                      onChange={(e) => setVillageOrCity(e.target.value)}
                    />
                  )}

                  {villageOrCity === '__custom__' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        required
                        placeholder="Type your Village / Tola / Mohalla name"
                        className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-navy"
                        value={customVillage}
                        onChange={(e) => setCustomVillage(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: Security Credentials */}
          <div className="border border-border p-4 bg-paper/50 rounded-[2px]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-forest border-b border-border pb-1.5 mb-3 flex items-center gap-1.5 font-mono">
              <span className="material-symbols-outlined text-base">lock</span>
              <span>3. Security Credentials / सुरक्षा पासवर्ड</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Create Password / पासवर्ड (min 6 chars) <span className="text-urgent">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-navy"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Confirm Password / पासवर्ड पुष्टि <span className="text-urgent">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full rounded-[2px] border border-border px-3 py-2 text-sm bg-white text-ink focus:outline-none focus:border-navy"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-urgent/10 border border-urgent/30 text-urgent text-xs rounded-[2px] font-medium flex items-center gap-2">
              <span className="font-bold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-xs uppercase tracking-wider font-bold shadow-sm"
          >
            {loading
              ? 'Processing Registration…'
              : role === 'university'
                ? `Complete Registration as ${univSubRole === 'student' ? 'Student Innovator' : univSubRole === 'mentor' ? 'Faculty Mentor' : 'Institution Node'} →`
                : role === 'industry'
                  ? 'Register Corporate CSR Entity →'
                  : 'Complete Registration / खाता पंजीकृत करें →'}
          </Button>

          {/* Institutional Compliance Notice */}
          <p className="text-[11px] text-ink-muted text-center font-mono leading-relaxed pt-1">
            By registering, your account will be indexed in the Jharkhand State Innovation &amp; Grievance Registry under Department of Higher &amp; Technical Education.
          </p>
        </form>

        {/* ========================================================================= */}
        {/* OFFICIAL NIC-STYLE FOOTER: SIGN-IN & PORTAL SWITCHER                      */}
        {/* ========================================================================= */}
        <div className="mt-6 pt-3.5 border-t border-border">
          <div className="bg-[#F8F6F0] border border-border px-3.5 py-2.5 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-ink-muted">Already registered with Samadhan Setu?</span>
              <Link
                to={
                  isCitizenOnly
                    ? '/login?role=citizen&for=submit'
                    : isUniversityOnly
                      ? `/login?role=university&type=${univSubRole === 'institution' ? 'dean' : univSubRole}`
                      : isIndustryOnly
                        ? '/login?role=industry'
                        : `/login?role=${role}${role === 'university' ? `&type=${univSubRole}` : ''}`
                }
                className="font-bold text-navy hover:text-forest underline decoration-turmeric-deep decoration-2 underline-offset-2 transition-colors whitespace-nowrap"
              >
                Sign In to Account / लॉगिन करें →
              </Link>
            </div>

            {(isCitizenOnly || isUniversityOnly || isIndustryOnly) && (
              <button
                type="button"
                onClick={() => setShowAllRoles(true)}
                className="text-[11px] text-ink-muted hover:text-navy hover:underline transition-colors flex items-center gap-1 self-start sm:self-auto cursor-pointer font-medium whitespace-nowrap"
              >
                <span>🌐</span>
                <span>Show All Portals</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
