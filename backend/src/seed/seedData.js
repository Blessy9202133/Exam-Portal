const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/exam_portal';

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    await Employee.deleteMany({});
    await Question.deleteMany({});
    await ExamAttempt.deleteMany({});
    console.log('Cleared existing database records.');

    const hashedPassword = await bcrypt.hash('123456', 10);
    const adminHashedPassword = await bcrypt.hash('123456', 10);

    // Seed Employees
    const employees = [
      {
        employeeId: '123456',
        name: 'System Administrator',
        email: 'admin@examportal.com',
        password: adminHashedPassword,
        department: 'I&C',
        level: 'L3',
        role: 'ADMIN',
      },
      {
        employeeId: 'EMP1001',
        name: 'I&C Testing L1 User',
        email: 'ic.l1@examportal.com',
        password: hashedPassword,
        department: 'I&C',
        level: 'L1',
        role: 'EMPLOYEE',
      },
      {
        employeeId: 'EMP1002',
        name: 'I&C Testing L2 User',
        email: 'ic.l2@examportal.com',
        password: hashedPassword,
        department: 'I&C',
        level: 'L2',
        role: 'EMPLOYEE',
      },
      {
        employeeId: 'EMP1003',
        name: 'I&C Testing L3 User',
        email: 'ic.l3@examportal.com',
        password: hashedPassword,
        department: 'I&C',
        level: 'L3',
        role: 'EMPLOYEE',
      },
      {
        employeeId: 'EMP2001',
        name: 'PE Testing L1 User',
        email: 'pe.l1@examportal.com',
        password: hashedPassword,
        department: 'Project Engineering (PE)',
        level: 'L1',
        role: 'EMPLOYEE',
      },
      {
        employeeId: 'EMP2002',
        name: 'PE Testing L2 User',
        email: 'pe.l2@examportal.com',
        password: hashedPassword,
        department: 'Project Engineering (PE)',
        level: 'L2',
        role: 'EMPLOYEE',
      },
      {
        employeeId: 'EMP3001',
        name: 'IV&V Testing L1 User',
        email: 'ivv.l1@examportal.com',
        password: hashedPassword,
        department: 'IV&V',
        level: 'L1',
        role: 'EMPLOYEE',
      },
      {
        employeeId: 'EMP3002',
        name: 'IV&V Testing L2 User',
        email: 'ivv.l2@examportal.com',
        password: hashedPassword,
        department: 'IV&V',
        level: 'L2',
        role: 'EMPLOYEE',
      },
      {
        employeeId: 'EMP3003',
        name: 'IV&V Testing L3 User',
        email: 'ivv.l3@examportal.com',
        password: hashedPassword,
        department: 'IV&V',
        level: 'L3',
        role: 'EMPLOYEE',
      },
      {
        employeeId: 'EMP4001',
        name: 'Doc Controller Testing L1 User',
        email: 'doc.l1@examportal.com',
        password: hashedPassword,
        department: 'Doc Controller',
        level: 'L1',
        role: 'EMPLOYEE',
      },
      {
        employeeId: 'EMP4002',
        name: 'Doc Controller Testing L2 User',
        email: 'doc.l2@examportal.com',
        password: hashedPassword,
        department: 'Doc Controller',
        level: 'L2',
        role: 'EMPLOYEE',
      },
      {
        employeeId: 'EMP5001',
        name: 'Analysis Testing L1 User',
        email: 'analysis.l1@examportal.com',
        password: hashedPassword,
        department: 'Analysis',
        level: 'L1',
        role: 'EMPLOYEE',
      },
      {
        employeeId: 'EMP5002',
        name: 'Analysis Testing L2 User',
        email: 'analysis.l2@examportal.com',
        password: hashedPassword,
        department: 'Analysis',
        level: 'L2',
        role: 'EMPLOYEE',
      },
      {
        employeeId: 'EMP5003',
        name: 'Analysis Testing L3 User',
        email: 'analysis.l3@examportal.com',
        password: hashedPassword,
        department: 'Analysis',
        level: 'L3',
        role: 'EMPLOYEE',
      },
    ];

    await Employee.insertMany(employees);
    console.log(`Inserted ${employees.length} employees with testing names.`);

    const questionsList = [];

    const createDepartmentQuestions = (dept, easyList, modList, toughList) => {
      easyList.forEach(q => questionsList.push({ department: dept, difficulty: 'EASY', questionText: q[0], options: q[1], correctOptionIndex: q[2], marks: 1, explanation: q[3] }));
      modList.forEach(q => questionsList.push({ department: dept, difficulty: 'MODERATE', questionText: q[0], options: q[1], correctOptionIndex: q[2], marks: 2, explanation: q[3] }));
      toughList.forEach(q => questionsList.push({ department: dept, difficulty: 'TOUGH', questionText: q[0], options: q[1], correctOptionIndex: q[2], marks: 5, explanation: q[3] }));
    };

    // 1. I&C Questions (25 Questions)
    const icEasy = [
      ["What is the standard signal range for 4-20 mA current loops in I&C systems?", ["0-10 V", "4-20 mA", "1-5 V", "0-50 mA"], 1, "4-20 mA is standard for analog instrumentation signaling."],
      ["Which sensor is widely used for measuring temperature in industrial piping?", ["RTD (Pt100)", "Strain Gauge", "LVDT", "Photoelectric Cell"], 0, "Pt100 RTD provides accurate industrial temperature sensing."],
      ["What is the main function of a Control Valve in an I&C loop?", ["Measuring flow rate", "Regulating process variable by varying fluid flow", "Converting analog to digital", "Generating power"], 1, "Control Valves act as final control elements."],
      ["Which transmitter measures pressure difference across an orifice plate?", ["Differential Pressure Transmitter (DPT)", "Temperature Transmitter", "Level Switch", "Tachometer"], 0, "DPT measures pressure drop to calculate flow."],
      ["What does PLC stand for in automation?", ["Programmable Logic Controller", "Process Level Computer", "Power Control Loop", "Performance Line Controller"], 0, "PLC handles industrial logic automation."],
      ["What is the purpose of a Thermocouple?", ["Measure temperature via Seebeck Effect", "Measure pressure", "Regulate current", "Detect gas leaks"], 0, "Thermocouples produce voltage proportional to temperature difference."],
      ["Which valve fail-safe mode opens the valve upon loss of instrument air?", ["Fail Open (FO)", "Fail Closed (FC)", "Fail In Place (FIP)", "Fail Lock"], 0, "Fail Open valves spring open when air pressure fails."],
      ["What is the function of a Signal Isolator?", ["Prevent ground loops and electrical interference", "Boost air pressure", "Cool electronic components", "Store digital logs"], 0, "Isolators isolate input/output loops galvanically."],
      ["What does SCADA stand for?", ["Supervisory Control and Data Acquisition", "System Control and Digital Automation", "Signal Conversion and Data Analysis", "Safety Controller and Digital Alarm"], 0, "SCADA supervises and collects data from remote systems."],
      ["Which pressure units are commonly used in industrial process gauges?", ["Bar / PSI / kPa", "Amperes", "Volts", "Lumens"], 0, "Bar, PSI, and kPa measure pressure."]
    ];

    const icMod = [
      ["Which protocol overlays FSK digital communication on a 4-20 mA analog loop?", ["Modbus", "HART Protocol", "Profinet", "DeviceNet"], 1, "HART overlays digital signals on analog current loops."],
      ["What is the purpose of a PID Controller in process control?", ["Proportional, Integral, Derivative control to minimize error", "Programmable Interface Device", "Phase Inverter Driver", "Pressure Inspection Detector"], 0, "PID minimizes process error continuously."],
      ["What is SIL (Safety Integrity Level) according to IEC 61508 / 61511?", ["Relative measure of safety risk reduction provided by a Safety Instrumented Function", "Signal Intensity Level", "Sensor Isolation Limit", "System Input Load"], 0, "SIL 1 to SIL 4 quantifies safety risk reduction."],
      ["In a control loop, what does Integral action (I-term) do?", ["Eliminates steady-state offset error", "Responds to rate of change", "Provides immediate gain", "Inverts output polarity"], 0, "Integral term accumulates error over time to eliminate offset."],
      ["Which flow meter operates based on Faraday's Law of Electromagnetic Induction?", ["Magnetic Flow Meter (Magmeter)", "Vortex Flow Meter", "Coriolis Flow Meter", "Rotameter"], 0, "Magmeters measure conductive fluid velocity using Faraday's law."],
      ["What is the primary advantage of a Coriolis Mass Flow Meter?", ["Direct mass flow measurement independent of fluid density or viscosity", "Lowest cost", "No electrical power needed", "Requires no straight pipe runs"], 0, "Coriolis meters directly measure true mass flow rate."],
      ["What does Hazardous Area Classification Zone 0 signify?", ["Explosive gas atmosphere is continuously present or present for long periods", "No explosive gas", "Gas present only during accidents", "Safe office zone"], 0, "Zone 0 has continuous explosive gas hazard."],
      ["In a PLC program, what is a Watchdog Timer used for?", ["Detecting software loop freezes or hardware execution stalls", "Displaying real clock time", "Setting pulse frequency", "Counting inputs"], 0, "Watchdog resets processor if cycle time exceeds threshold."],
      ["What is the function of an I/P Converter?", ["Converts Current (4-20mA) signal to Pneumatic pressure (3-15 PSI)", "Converts Voltage to Current", "Converts Input to Power", "Converts Pulse to Frequency"], 0, "I/P converter translates current signals into pneumatic control pressure."],
      ["Which fieldbus technology uses 2-wire MBP physical layer for intrinsically safe zones?", ["FOUNDATION Fieldbus H1 / PROFIBUS PA", "Ethernet/IP", "RS232", "CANopen"], 0, "FF H1 / PROFIBUS PA delivers power and signal over 2 wires in hazard areas."]
    ];

    const icTough = [
      ["What is 2-out-of-3 (2oo3) voting architecture in Safety Instrumented Systems (SIS)?", ["Triple Modular Redundant scheme where 2 out of 3 channels must agree to trip system", "Dual sensor backup", "Single channel trip", "Manual bypass scheme"], 0, "2oo3 voting maximizes availability and safety reliability."],
      ["In control valve sizing, what is Cavitation and how is it prevented?", ["Formation and violent collapse of vapor bubbles when pressure drops below vapor pressure then recovers; prevented by anti-cavitation trim", "Gas leakage", "Stem friction", "Air lock in actuator"], 0, "Anti-cavitation trims stage pressure drop to prevent bubble collapse damage."],
      ["What is the mathematical relation for Derivative action (D-term) in PID control?", ["Derivative term predicts future error based on rate of change d(error)/dt", "Sum of error over time", "Proportional constant times error", "Inverse of error"], 0, "Derivative action damps overshoot by acting on error rate of change."],
      ["How does an Intrinsic Safety Barrier protect instrumentation in Zone 0 hazardous locations?", ["Limits electrical and thermal energy below ignition threshold of explosive gas", "Uses heavy explosion-proof steel conduit", "Purges air with nitrogen", "Cools equipment with oil"], 0, "Zener/galvanic barriers limit voltage and current to safe energy levels."],
      ["What is Proof Testing in Functional Safety (IEC 61511)?", ["Periodic test performed to detect unrevealed fail-dangerous faults in Safety Instrumented Functions", "Initial factory inspection", "Software compilation test", "Visual check of cables"], 0, "Proof testing reveals hidden dangerous failures in safety loops."]
    ];

    createDepartmentQuestions('I&C', icEasy, icMod, icTough);

    // 2. Project Engineering (PE) Questions (25 Questions)
    const peEasy = [
      ["What component is primarily used as a controlled semiconductor switch in PE inverters?", ["IGBT / SCR / MOSFET", "Resistor", "Inductor", "Zener Diode"], 0, "IGBTs and SCRs are fundamental power switches."],
      ["What is the main purpose of an Inverter in Power Electronics?", ["Converts DC power to AC power", "Converts AC to DC", "Steps up DC voltage", "Filters noise"], 0, "Inverters convert DC source into AC load voltage."],
      ["What is the function of a Rectifier?", ["Converts AC power to DC power", "Converts DC to AC", "Amplifies signal", "Stores energy"], 0, "Rectifiers convert AC supply into DC."],
      ["Which component stores energy in a magnetic field in switching converters?", ["Inductor", "Capacitor", "Diode", "Resistor"], 0, "Inductors store energy in magnetic flux."],
      ["What does PWM stand for in motor drive technology?", ["Pulse Width Modulation", "Power Waveform Method", "Phase Width Measurement", "Peak Wattage Meter"], 0, "PWM controls average voltage by varying pulse duty cycle."],
      ["Which component stores energy in an electric field to smooth DC voltage ripple?", ["Capacitor", "Inductor", "Transformer", "Rheostat"], 0, "Capacitors filter DC voltage ripple."],
      ["What is a Flyback Diode used for in inductive switching circuits?", ["Suppresses voltage spikes across inductive loads during turn-off", "Increases current", "Blocks AC voltage", "Generates pulses"], 0, "Flyback diodes absorb inductive kickback voltage spikes."],
      ["What does VFD stand for in industrial plant automation?", ["Variable Frequency Drive", "Voltage Flow Detector", "Vector Field Device", "Visual Frequency Display"], 0, "VFD controls AC motor speed by varying frequency."],
      ["What is the function of a Transformer in electrical power systems?", ["Steps up or steps down AC voltage levels", "Converts DC to AC", "Stores electrical charge", "Regulates frequency"], 0, "Transformers change AC voltage levels magnetically."],
      ["What is the nominal AC line frequency used in most industrial power grids?", ["50 Hz or 60 Hz", "100 Hz", "10 Hz", "1000 Hz"], 0, "50 Hz or 60 Hz is global power line standard."]
    ];

    const peMod = [
      ["What is the duty cycle formula for a Buck Converter in continuous conduction mode?", ["Vout / Vin", "Vin / Vout", "1 / (1 - D)", "D / (1 - D)"], 0, "Vout = D * Vin for step-down Buck converter."],
      ["What does Total Harmonic Distortion (THD) measure in power systems?", ["Harmonic distortion relative to fundamental frequency", "Total heat generated", "Peak voltage drop", "Efficiency percentage"], 0, "THD quantifies power quality waveform purity."],
      ["What is the voltage transfer ratio formula for a Boost Converter?", ["Vout = Vin / (1 - D)", "Vout = D * Vin", "Vout = Vin * (1 - D)", "Vout = Vin / D"], 0, "Boost converter steps up voltage by factor 1/(1-D)."],
      ["In a 3-Phase Voltage Source Inverter (VSI), what is the phase shift between line voltages?", ["120 degrees", "90 degrees", "180 degrees", "60 degrees"], 0, "3-phase electrical systems are offset by 120 degrees."],
      ["What is the function of a Snubber Circuit connected across power switches?", ["Limits rate of rise of voltage (dV/dt) and current (dI/dt)", "Increases switching frequency", "Measures output current", "Cools heat sink"], 0, "Snubbers suppress high dV/dt spikes during switching."],
      ["What is the primary cause of Power Factor degradation in non-linear loads?", ["Harmonic currents and phase displacement", "Pure resistive load", "High DC voltage", "Zero load current"], 0, "Harmonics and phase angle reduce overall power factor."],
      ["What type of converter is used for soft starting large 3-phase induction motors?", ["Thyristor-based AC Voltage Controller", "DC-DC Buck Converter", "Diode Bridge Rectifier", "Flyback Converter"], 0, "AC voltage controllers gradually ramp voltage during motor startup."],
      ["What is Galvanic Isolation in power supply design?", ["Electrical isolation using transformer magnetic coupling without direct electrical path", "Ground wire connection", "Direct copper jumper", "Resistor divider"], 0, "Galvanic isolation isolates input/output electrically."],
      ["What is the main advantage of SiC (Silicon Carbide) MOSFETs over silicon IGBTs?", ["Higher switching frequency and lower thermal losses", "Lowest purchase cost", "Operates only on DC", "Requires no cooling"], 0, "SiC wide-bandgap devices offer high speed and high efficiency."],
      ["What is a Chopper circuit in power electronics?", ["Converts fixed DC input into variable DC output", "Converts AC to AC", "Converts DC to AC", "Filters noise"], 0, "DC Chopper regulates DC voltage level."]
    ];

    const peTough = [
      ["How does Space Vector PWM (SVPWM) achieve higher DC bus utilization compared to Sinusoidal PWM?", ["SVPWM increases maximum output voltage by 15.5% using space vector synthesis", "By doubling switching frequency", "By eliminating all inductors", "By bypassing switches"], 0, "SVPWM optimizes DC bus utilization by synthesizing voltage vectors."],
      ["What is the purpose of Active Front End (AFE) rectifiers in regenerative drive applications?", ["Allows bi-directional power flow and eliminates low-order harmonics on grid side", "Blocks reverse power", "Steps down DC voltage", "Replaces motor bearings"], 0, "AFE feeds braking energy back to grid with clean power factor."],
      ["In a 3-level Neutral Point Clamped (NPC) inverter, what is the main benefit over 2-level topologies?", ["Reduces voltage stress (dV/dt) by half and lowers output harmonic distortion", "Uses fewer switches", "Requires no DC capacitor", "Simplifies gating"], 0, "3-level NPC reduces switch voltage stress and output THD."],
      ["What is zero-voltage switching (ZVS) in resonant power converters?", ["Switches turn ON when switch voltage is zero, minimizing switching losses", "Switching at maximum voltage", "Switching with high current", "Manual toggle switching"], 0, "ZVS eliminates turn-on switching losses."],
      ["What is Thermal Runaway in power semiconductor modules?", ["Positive feedback loop where temperature rise increases leakage current, destroying device", "Cooling fan speed increase", "Voltage drop reduction", "Normal thermal steady state"], 0, "Thermal runaway leads to catastrophic semiconductor destruction."]
    ];

    createDepartmentQuestions('Project Engineering (PE)', peEasy, peMod, peTough);

    // 3. IV&V Questions (25 Questions)
    const ivvEasy = [
      ["What does IV&V stand for in software quality engineering?", ["Independent Verification & Validation", "Integrated Version & Volume", "Internal Verification & Vectoring", "Interactive Visual Validation"], 0, "IV&V ensures unbiased, third-party software safety assurance."],
      ["What is the key difference between Verification and Validation?", ["Verification: Building product right; Validation: Building right product", "No difference", "Verification is for hardware only", "Validation is done by customer only"], 0, "Verification checks specs compliance; Validation checks operational fitness."],
      ["What is the main objective of Black-box Testing?", ["Testing functionality without knowledge of internal code structure", "Testing internal code lines", "Compiling code", "Writing SQL scripts"], 0, "Black-box testing focuses on inputs and expected outputs."],
      ["What is a Software Defect (Bug)?", ["Discrepancy between actual behavior and specified requirements", "Hardware failure", "User typing mistake", "Database table"], 0, "Defects represent non-conformance to requirements."],
      ["What does Regression Testing verify?", ["Ensures recent code changes have not broken existing functionality", "Tests code performance", "Checks database backup", "Installs updates"], 0, "Regression testing re-verifies unaffected features."],
      ["What is a Test Case?", ["Set of inputs, execution conditions, and expected results", "Source code file", "Bug report", "User manual"], 0, "Test cases define step-by-step verification procedures."],
      ["What is White-box Testing?", ["Testing internal logic, code paths, and structure", "Testing UI color palette", "User feedback survey", "Server installation"], 0, "White-box testing inspects internal code implementation."],
      ["What does QA stand for in project delivery?", ["Quality Assurance", "Quick Assessment", "Query Automation", "Quantitative Analysis"], 0, "QA focuses on process and quality standards compliance."],
      ["What is Sanity Testing?", ["Quick execution of subset of tests to verify basic functionality after bug fixes", "Exhaustive testing", "Load test", "Security penetration test"], 0, "Sanity tests verify build readiness."],
      ["What is User Acceptance Testing (UAT)?", ["Testing performed by end users to confirm system meets business needs", "Unit testing", "Compiler syntax check", "Network ping test"], 0, "UAT validates software against business workflows."]
    ];

    const ivvMod = [
      ["What is a Traceability Matrix in IV&V auditing?", ["Document linking requirements to test cases and code components", "Hardware wiring diagram", "Project budget sheet", "Employee attendance log"], 0, "Traceability Matrix ensures 100% test coverage for requirements."],
      ["What is Boundary Value Analysis (BVA)?", ["Testing at extreme limits of input domain boundaries", "Testing random values", "Testing database schema", "Stress testing CPU"], 0, "BVA tests boundary values where bugs cluster."],
      ["What does Cyclomatic Complexity measure in source code analysis?", ["Number of linearly independent paths through code", "Lines of code length", "Number of variables", "File download speed"], 0, "McCabe complexity measures code control flow complexity."],
      ["What is Static Code Analysis?", ["Automated analysis of code without executing it", "Running unit tests", "Manual user testing", "Screen capture recording"], 0, "Static analysis finds syntax, security, and logic flaws early."],
      ["In software safety standard IEC 61508, what is the role of IV&V?", ["Provides independent third-party assessment of safety integrity", "Designs database", "Writes user UI", "Sells licenses"], 0, "IV&V provides independent safety compliance audit."],
      ["What is Equivalence Partitioning in test design?", ["Dividing input data into valid and invalid partitions executed by representative tests", "Testing every single number", "Sorting array data", "Encrypting files"], 0, "Equivalence partitioning optimizes test case counts."],
      ["What is standard ISO/IEC 25010 used for?", ["Software Quality Model defining functional and non-functional quality attributes", "Networking cabling", "Electrical safety", "Resistor color coding"], 0, "ISO 25010 defines software quality metrics."],
      ["What is the goal of Stress Testing in validation?", ["Testing system stability beyond normal operational capacity limits", "Testing single user login", "Formatting code", "Creating mockups"], 0, "Stress testing verifies behavior under extreme load."],
      ["What is a Peer Review in software verification?", ["Formal inspection of artifacts by team members to find flaws early", "Manager performance review", "Client demo", "Salary appraisal"], 0, "Peer reviews catch design/code issues before testing phase."],
      ["What is Code Coverage percentage?", ["Metric indicating proportion of code executed during automated testing", "Disk space used", "RAM consumption", "Network bandwidth"], 0, "Code coverage measures test suite thoroughness."]
    ];

    const ivvTough = [
      ["What is Modified Condition/Decision Coverage (MC/DC) testing required for SIL-4 software?", ["Criteria ensuring each condition independently affects decision outcome", "100% line coverage", "Statement execution", "Boundary value check"], 0, "MC/DC proves every logical condition independently influences outcomes."],
      ["In safety-critical software, what is Failure Modes and Effects Analysis (FMEA)?", ["Systematic technique to evaluate potential failure modes and their impact", "Unit test framework", "Code formatter", "Git branch rule"], 0, "FMEA analyzes failure modes and severity."],
      ["What is the key difference between IV&V and internal V&V?", ["IV&V is performed by an organization financially, managerially, and technically independent", "No difference", "IV&V is faster", "IV&V uses no tools"], 0, "Independence eliminates bias in safety assessments."],
      ["What is Fault Injection Testing in safety validation?", ["Intentionally introducing errors to verify system fault tolerance and safety shutdown", "Fixing code bugs", "Deleting logs", "Bypassing passwords"], 0, "Fault injection proves robust exception handling and safe fallback."],
      ["What is Hazard Analysis in safety-critical system verification?", ["Identifying potential hazards and assigning safety risk index (SIL)", "Calculating project cost", "Counting lines of code", "Designing logos"], 0, "Hazard analysis establishes safety integrity requirements."]
    ];

    createDepartmentQuestions('IV&V', ivvEasy, ivvMod, ivvTough);

    // 4. Doc Controller Questions (25 Questions)
    const docEasy = [
      ["What is the primary role of a Document Controller?", ["Manage, track, and maintain controlled engineering documentation and revisions", "Coding backend APIs", "Testing hardware", "Purchasing office supplies"], 0, "Doc Controllers maintain version control and document distribution."],
      ["Why is Revision History critical in project documentation?", ["Prevents engineers from using obsolete drawings or specs", "Improves font style", "Increases file size", "None"], 0, "Revision control ensures work uses current approved designs."],
      ["What does EDMS stand for in document control?", ["Electronic Document Management System", "Electrical Data Management Service", "Engineering Design Main Station", "Emergency Data Backup System"], 0, "EDMS stores and manages electronic technical records."],
      ["What is an As-Built Drawing?", ["Final revised drawing reflecting exact physical installation", "Initial proposal sketch", "Deleted draft", "Cost estimate sheet"], 0, "As-Built drawings capture final site installation reality."],
      ["What is the purpose of a Document Numbering System?", ["Assigning unique identifiers to documents for tracking", "Adding page numbers", "Counting total words", "Changing file names"], 0, "Document numbers provide unique lifecycle identification."],
      ["What is a Confidentiality Notice on controlled documents?", ["Warning protecting proprietary project data from unauthorized sharing", "Formatting rule", "Print setting", "Font size choice"], 0, "Confidentiality notices safeguard intellectual property."],
      ["What does Master Document Register (MDR) contain?", ["Comprehensive log of all project documents, revisions, and approval statuses", "Employee payroll", "Office inventory", "Email inbox"], 0, "MDR tracks every project deliverable's progress."],
      ["What is a Hard Copy vs Soft Copy in document archives?", ["Physical printed document vs digital electronic file", "Heavy paper vs light paper", "Encrypted file vs open file", "None"], 0, "Hard copies are paper; soft copies are digital."],
      ["What is Document Retention Policy?", ["Guidelines for how long documents must be stored before archiving or disposal", "Print speed settings", "Font guidelines", "Folder color rules"], 0, "Retention policies define legal and operational storage rules."],
      ["What does PDF stand for in document distribution?", ["Portable Document Format", "Public Data File", "Print Description Folder", "Program Definition File"], 0, "PDF is standard cross-platform document format."]
    ];

    const docMod = [
      ["What does Transmittal Notice (TRN) mean in Document Management?", ["Formal record accompanying the distribution of documents between parties", "Software installation key", "Bank payment receipt", "Tax invoice"], 0, "Transmittals provide formal proof of document handover."],
      ["In ISO 9001 EDMS, what is the difference between Major and Minor document revisions?", ["Major revision changes design/spec and requires re-approval; Minor revision corrects typos without structural impact", "Major is PDF, Minor is Word", "No difference", "Major is for internal use only"], 0, "Major revisions affect form/fit/function requiring formal re-approval."],
      ["What is a Vendor Document Review workflow?", ["Process of reviewing and approving supplier drawings against project engineering specs", "Paying supplier bills", "Shipping packages", "Buying hardware"], 0, "Vendor review ensures supplier submittals match project specs."],
      ["What is Redlining in drawing review?", ["Marking up changes on printed or PDF drawings using red ink/annotations", "Deleting lines", "Drawing red boxes for design", "Painting CAD borders"], 0, "Redlining highlights revisions for CAD drafters to update."],
      ["What is a Request for Information (RFI) in engineering doc control?", ["Formal query seeking clarification on drawings or specs", "Request for money", "Software order", "Leave application"], 0, "RFIs resolve technical ambiguities between contractor and client."],
      ["What is Superseded status on a drawing?", ["Status indicating drawing has been replaced by a newer approved revision", "Approved drawing", "Draft drawing", "Rejected drawing"], 0, "Superseded drawings must not be used for construction."],
      ["What is an Audit Trail in EDMS software?", ["Immutable chronological log recording who accessed, edited, or approved files", "Backup zip file", "User password list", "Virus scanner log"], 0, "Audit trails ensure compliance and accountability."],
      ["What is a Controlled Document vs Uncontrolled Document?", ["Controlled document is actively tracked and updated; Uncontrolled is static snapshot copy", "Password protected vs open", "PDF vs Word", "Internal vs External"], 0, "Controlled docs receive automatic revision updates."],
      ["What is a Document Distribution Matrix?", ["Table specifying which project stakeholders receive copies of specific document types", "Excel calculation matrix", "Printer queue list", "Folder list"], 0, "Distribution matrices route documents to correct departments."],
      ["What is Handover Documentation in EPC projects?", ["Final package of operation manuals, test certificates, and drawings handed to client", "Daily attendance sheet", "Initial bid doc", "Expense report"], 0, "Handover package enables client plant operations."]
    ];

    const docTough = [
      ["What is the standard procedure when an obsolete drawing is mistakenly used in manufacturing?", ["Immediately issue Non-Conformance Report (NCR) and recall drawing", "Ignore if work is done", "Delete file from server", "Change drawing date"], 0, "NCR halts non-conforming work and enforces corrective action."],
      ["What is ISO 15489 standard focused on?", ["Records Management principles and policies", "Quality management", "Software testing", "Electrical wiring"], 0, "ISO 15489 governs international records management standards."],
      ["How does digital signing with PKI certificates ensure document integrity?", ["Cryptographically verifies author identity and detects any tampering post-signature", "Converts document to image", "Compresses file size", "Prints barcode"], 0, "PKI digital signatures guarantee authenticity and non-repudiation."],
      ["In large EPC projects, what is a Work Package Document Index (WPDI)?", ["Log binding engineering deliverables to specific construction execution packages", "Subcontractor list", "Vehicle log", "Stationery list"], 0, "WPDI links drawings to construction execution packages."],
      ["What is the purpose of Document Access Security Matrix (Role-Based Access Control - RBAC)?", ["Restricts view, edit, approve, and delete permissions based on user role", "Changes screen brightness", "Monitors network speed", "Saves battery"], 0, "RBAC prevents unauthorized document modification or release."]
    ];

    createDepartmentQuestions('Doc Controller', docEasy, docMod, docTough);

    // 5. Analysis Questions (25 Questions)
    const analysisEasy = [
      ["What is the primary objective of data analysis in engineering systems?", ["Extract actionable insights and pattern trends from raw system data", "Increase hard drive storage", "Format spreadsheets", "Print report pages"], 0, "Data analysis transforms raw metrics into operational intelligence."],
      ["What type of analysis focuses on historical data to answer 'what happened'?", ["Descriptive Analysis", "Predictive Analysis", "Prescriptive Analysis", "Diagnostic Analysis"], 0, "Descriptive analysis summarizes historical performance."],
      ["Which statistical metric measures the central value of a data distribution?", ["Mean", "Standard Deviation", "Variance", "Range"], 0, "Mean represents the arithmetic average value."],
      ["What is an outlier in statistical data analysis?", ["A data point that significantly differs from other observations", "The maximum allowed value", "A missing data field", "A zero value"], 0, "Outliers deviate markedly from the general data pattern."],
      ["Which chart type is best for showing trends over continuous time intervals?", ["Line Chart", "Pie Chart", "Scatter Plot", "Gauge Chart"], 0, "Line charts visually track continuous trends over time."],
      ["What is Root Cause Analysis (RCA)?", ["Structured problem-solving method to identify fundamental causes of failures", "Calculating average speed", "Deleting log files", "Hardware assembly"], 0, "RCA prevents recurring defects by addressing root causes."],
      ["What does Pareto Analysis (80/20 Rule) state?", ["roughly 80% of consequences come from 20% of causes", "All causes have equal impact", "100% data must be analyzed", "80% of time is spent on 20% tasks"], 0, "Pareto principle helps prioritize high-impact issues."],
      ["What is data normalization?", ["Scaling numerical data to a standard range to eliminate bias", "Encrypting files", "Deleting duplicates", "Sorting alphabetically"], 0, "Normalization adjusts values to a common scale."],
      ["Which tool is commonly used for statistical computing and data analysis?", ["Python / R", "MS Paint", "Notepad", "Calculator app"], 0, "Python and R are leading data analytics languages."],
      ["What is a correlation between two variables?", ["Statistical association measuring how strongly variables move together", "Cause and effect proof", "Database key", "File format"], 0, "Correlation quantifies directional linear relationships."]
    ];

    const analysisMod = [
      ["What is the main difference between Correlation and Causation?", ["Correlation indicates a statistical relationship, while Causation proves one event directly causes another", "They are identical", "Causation applies only to hardware", "Correlation requires 100% accuracy"], 0, "Correlation does not imply causation."],
      ["What is Predictive Analytics?", ["Using statistical models and machine learning to forecast future outcomes from historical data", "Writing daily summary logs", "Deleting old records", "System backup"], 0, "Predictive analytics projects future trends using statistical algorithms."],
      ["What is a Confusion Matrix in predictive classification analysis?", ["Performance evaluation table comparing actual vs predicted classification values", "Database error log", "Spreadsheet corruption error", "Network matrix"], 0, "Confusion matrix calculates True Positives, False Positives, etc."],
      ["What is a Histogram used for in data analysis?", ["Displaying the frequency distribution of a continuous numeric variable", "Showing pie proportions", "Creating flowcharts", "Listing user names"], 0, "Histograms plot frequency density across data bins."],
      ["What is Regression Analysis?", ["Statistical modeling technique to estimate relationships between a dependent variable and independent variables", "Undoing software updates", "Database rollbacks", "Formatting text"], 0, "Regression estimates conditional expectations between variables."],
      ["What is Variance in statistics?", ["Measure of how far a set of numbers are spread out from their average value", "The maximum minus minimum", "The mode value", "Total sum of data"], 0, "Variance quantifies spread around the arithmetic mean."],
      ["In data preprocessing, what is Data Imputation?", ["Technique of replacing missing values with substituted logical or statistical values", "Deleting rows", "Encrypting text", "Sorting columns"], 0, "Imputation preserves sample size by filling missing values."],
      ["What is a Heatmap visualization?", ["Graphical representation of data where values are represented as colors", "Temperature log", "CPU fan monitor", "Memory map"], 0, "Heatmaps convey magnitude using color intensity."],
      ["What is Hypothesis Testing in statistical analysis?", ["Method for testing a claim or hypothesis about a population parameter using sample data", "Trial and error coding", "Software debugging", "Guessing outcomes"], 0, "Hypothesis testing evaluates statistical significance."],
      ["What is Time Series Analysis?", ["Analyzing a sequence of data points recorded at specific successive time intervals", "Timing code execution speed", "Clock synchronization", "Log file timestamps"], 0, "Time series models temporal dependencies over time."]
    ];

    const analysisTough = [
      ["In statistical modeling, what is Overfitting?", ["When a model learns noise and details in training data so well that it negatively impacts performance on new data", "When data file is too large", "When memory exceeds capacity", "When variable count is zero"], 0, "Overfitting fails to generalize to unseen test data."],
      ["What is Monte Carlo Simulation?", ["Computational technique using repeated random sampling to model probability of complex uncertain outcomes", "Casino gambling software", "Sorting algorithm", "Graphics rendering"], 0, "Monte Carlo quantifies risk across probabilistic variables."],
      ["What is Principal Component Analysis (PCA)?", ["Dimensionality reduction technique that transforms correlated variables into principal uncorrelated components", "Database indexing", "File compression", "Sorting algorithm"], 0, "PCA simplifies feature space while retaining variance."],
      ["What is p-value in statistical hypothesis testing?", ["Probability of obtaining test results at least as extreme as observed results, assuming null hypothesis is true", "Performance value", "Percentage score", "Positive coefficient"], 0, "p-value <= 0.05 typically indicates statistical significance."],
      ["In time series forecasting, what does ARIMA stand for?", ["AutoRegressive Integrated Moving Average", "Automated Real-time Information Management Architecture", "Analytical Risk & Impact Metric Algorithm", "Advanced Rate Integration Method"], 0, "ARIMA models auto-regressive and moving average time series trends."]
    ];

    createDepartmentQuestions('Analysis', analysisEasy, analysisMod, analysisTough);

    await Question.insertMany(questionsList);
    console.log(`Inserted ${questionsList.length} questions into Question Bank.`);

    console.log('Database seeding completed successfully with testing names!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
