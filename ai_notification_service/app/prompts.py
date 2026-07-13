"""
ProactiveCare – Prompt Engineering Engine
==========================================

This module is the BRAIN of the AI Communication Engine.
It constructs the prompts that guide Gemini to generate
personalized, safe, multilingual hospital notifications.

Architecture:
    1. SYSTEM_PROMPT     → Global rules (tone, safety, privacy, format)
    2. EVENT_PROMPTS     → Per-event instructions and context requirements
    3. build_prompt()    → Combines system + event + patient data into a final prompt

Design philosophy:
    - Prompts are carefully engineered for consistency and safety
    - The system prompt acts as a "constitution" the AI always follows
    - Event prompts provide specific guidance for each hospital scenario
    - Patient data is injected dynamically — never hardcoded

Key safety rules embedded in prompts:
    - NEVER reveal specific diagnoses, test results, or conditions
    - NEVER include medication dosages in SMS/WhatsApp (only email)
    - Always use privacy-safe language for sensitive events
    - Keep messages concise (under word limits per channel)
"""

from app.schemas import EventType, Language, Channel, NotificationRequest


# ═══════════════════════════════════════════════════════════════════
# LANGUAGE DISPLAY NAMES — For prompt instructions
# ═══════════════════════════════════════════════════════════════════

LANGUAGE_NAMES: dict[Language, str] = {
    Language.ENGLISH: "English",
    Language.HINDI: "Hindi (हिन्दी)",
    Language.MARATHI: "Marathi (मराठी)",
}

# ═══════════════════════════════════════════════════════════════════
# WORD LIMITS — Different channels have different constraints
# ═══════════════════════════════════════════════════════════════════

CHANNEL_WORD_LIMITS: dict[Channel, int] = {
    Channel.SMS: 50,        # SMS has character limits — keep very concise
    Channel.WHATSAPP: 80,   # WhatsApp is more flexible but still mobile
    Channel.EMAIL: 150,     # Email can be longer and more detailed
}


# ═══════════════════════════════════════════════════════════════════
# SYSTEM PROMPT — The "Constitution" that governs ALL AI responses
# ═══════════════════════════════════════════════════════════════════

SYSTEM_PROMPT = """You are a professional hospital communication assistant for a healthcare system called ProactiveCare.

Your job is to generate personalized, empathetic, and clear patient notifications.

## STRICT RULES — You MUST follow these at all times:

### Tone & Style
- Be warm, polite, and professional
- Use a caring and empathetic tone — patients may be anxious
- Write in a natural, human-like manner — NOT robotic or template-like
- Keep messages concise and to the point
- Avoid unnecessary medical jargon — use simple language
- Use culturally appropriate greetings and respectful forms of address

### Patient Privacy — CRITICAL
- NEVER mention specific diagnoses, diseases, or medical conditions
- NEVER reveal specific test results or lab values
- NEVER include HIV status, cancer type, mental health conditions, or any sensitive diagnosis
- For lab results and test results, ONLY say results are "available" and ask the patient to consult their doctor or log in securely
- NEVER include sensitive information that could be read by someone other than the patient

### Message Format
- Do NOT include any subject line, greeting header, or sign-off unless specifically asked
- Generate ONLY the message body
- Do NOT use markdown formatting, bullet points, or numbered lists
- Write as a single flowing paragraph or at most two short paragraphs
- Do NOT add "Regards", "Sincerely", or any closing signature

### Content Rules
- Include all relevant details provided (doctor name, date, time, department)
- Use the patient's name naturally in the message
- If appointment details are provided, always include the date and time
- If a hospital name is provided, mention it naturally
- Be encouraging and positive where appropriate

## OUTPUT
Respond with ONLY the notification message text. No explanations, no metadata, no formatting.
"""


# ═══════════════════════════════════════════════════════════════════
# EVENT-SPECIFIC PROMPTS — Tailored instructions per hospital event
# ═══════════════════════════════════════════════════════════════════

EVENT_PROMPTS: dict[EventType, str] = {

    EventType.APPOINTMENT_REMINDER: (
        "Generate a friendly appointment reminder notification. "
        "Include the doctor's name, department, date, and time. "
        "Gently remind the patient to arrive a few minutes early "
        "and bring any relevant medical documents or previous reports. "
        "Make it feel like a caring reminder, not a cold alert."
    ),

    EventType.APPOINTMENT_RESCHEDULED: (
        "Generate a notification informing the patient that their appointment "
        "has been rescheduled. Include the new date and time clearly. "
        "Apologize briefly for any inconvenience. "
        "If previous date/time info is available in additional_info, mention it. "
        "Ask the patient to contact the hospital if the new time doesn't work."
    ),

    EventType.APPOINTMENT_CANCELLED: (
        "Generate a notification informing the patient that their appointment "
        "has been cancelled. Be empathetic and apologetic. "
        "Encourage the patient to reschedule at their convenience. "
        "Provide reassurance and offer to help with rebooking."
    ),

    EventType.MEDICINE_REMINDER: (
        "Generate a medicine reminder notification. "
        "If the medicine name is provided in additional_info, mention it. "
        "Remind the patient about the importance of taking their medication on time. "
        "Be encouraging and supportive — do NOT sound like a warning. "
        "Do NOT include specific dosage details in SMS or WhatsApp messages for privacy."
    ),

    EventType.LAB_REPORT_READY: (
        "Generate a notification that the patient's laboratory report is ready. "
        "Do NOT mention what the lab test was for or any results. "
        "Simply inform them that their report is available. "
        "Ask them to log in to the patient portal securely or visit the hospital "
        "to collect their report. Suggest consulting their doctor for interpretation."
    ),

    EventType.TEST_RESULT_AVAILABLE: (
        "Generate a notification that the patient's test results are now available. "
        "CRITICAL: Do NOT mention what the test was for, the test name, or any results. "
        "Simply say results are available and recommend consulting their doctor. "
        "Suggest they can view results securely through the patient portal or visit the hospital."
    ),

    EventType.SURGERY_REMINDER: (
        "Generate a surgery reminder notification. "
        "Include the scheduled date and time. "
        "If pre-surgery instructions are in additional_info, mention them gently. "
        "Be reassuring and calming — patients are often anxious before surgery. "
        "Remind them about fasting requirements or other preparations if provided."
    ),

    EventType.VACCINATION_REMINDER: (
        "Generate a vaccination reminder notification. "
        "If the vaccine name is in additional_info, mention it. "
        "Include the date, time, and location if provided. "
        "Be encouraging about the importance of vaccination. "
        "Keep the tone positive and supportive."
    ),

    EventType.ADMISSION_CONFIRMATION: (
        "Generate a hospital admission confirmation notification. "
        "Confirm the admission date and department. "
        "If ward number or bed details are in additional_info, include them. "
        "Provide a brief list of what to bring (ID, insurance, personal items). "
        "Be welcoming and reassuring."
    ),

    EventType.DISCHARGE_INSTRUCTIONS: (
        "Generate a discharge notification with care instructions. "
        "Welcome the patient's recovery progress. "
        "If follow-up date is provided, mention it. "
        "If discharge instructions are in additional_info, summarize them briefly. "
        "Remind them to take prescribed medications and rest adequately. "
        "Encourage them to contact the hospital if they have concerns."
    ),

    EventType.FOLLOW_UP_REMINDER: (
        "Generate a follow-up appointment reminder. "
        "Emphasize the importance of the follow-up for their recovery. "
        "Include the doctor's name, date, and time. "
        "Encourage them to bring any updates on their condition or new symptoms. "
        "Be caring and supportive."
    ),

    EventType.EMERGENCY_NOTIFICATION: (
        "Generate an urgent emergency notification. "
        "This should convey urgency clearly but without causing panic. "
        "Include relevant emergency details from additional_info if available. "
        "Provide clear instructions on what the patient should do. "
        "Keep it concise — emergency messages must be quickly readable."
    ),
}


# ═══════════════════════════════════════════════════════════════════
# PROMPT BUILDER — Assembles the final prompt from all components
# ═══════════════════════════════════════════════════════════════════

def build_prompt(request: NotificationRequest) -> tuple[str, str]:
    """
    Build the complete prompt for the AI model.

    Combines:
        1. System prompt (global rules)
        2. Event-specific instructions
        3. Patient context (dynamic data)
        4. Language and channel instructions

    Args:
        request: The validated notification request from the backend.

    Returns:
        A tuple of (system_prompt, user_prompt) to send to the AI model.
        - system_prompt: Goes into the system/instruction role
        - user_prompt: Goes into the user role with specific context
    """
    # ── Get event-specific instructions ──────────────────────
    event_instruction = EVENT_PROMPTS.get(
        request.event,
        "Generate an appropriate hospital notification based on the provided context.",
    )

    # ── Get language and channel config ──────────────────────
    target_language = LANGUAGE_NAMES.get(request.language, "English")
    word_limit = CHANNEL_WORD_LIMITS.get(request.channel, 80)

    # ── Build patient context block ──────────────────────────
    context_lines = [
        f"Patient Name: {request.patient_name}",
    ]

    if request.patient_age is not None:
        context_lines.append(f"Patient Age: {request.patient_age}")

    if request.patient_gender:
        context_lines.append(f"Patient Gender: {request.patient_gender}")

    if request.doctor:
        context_lines.append(f"Doctor: {request.doctor}")

    if request.department:
        context_lines.append(f"Department: {request.department}")

    if request.hospital_name:
        context_lines.append(f"Hospital: {request.hospital_name}")

    if request.appointment_date:
        context_lines.append(f"Date: {request.appointment_date}")

    if request.appointment_time:
        context_lines.append(f"Time: {request.appointment_time}")

    # Include additional_info fields
    if request.additional_info:
        for key, value in request.additional_info.items():
            # Convert snake_case keys to readable labels
            label = key.replace("_", " ").title()
            context_lines.append(f"{label}: {value}")

    patient_context = "\n".join(context_lines)

    # ── Assemble the user prompt ─────────────────────────────
    user_prompt = f"""## Task
{event_instruction}

## Patient Context
{patient_context}

## Language Requirement
Generate the message in {target_language}.
{"Write the ENTIRE message in " + target_language + ". Do NOT write in English." if request.language != Language.ENGLISH else ""}

## Channel & Length
This message will be sent via {request.channel.upper()}.
Keep the message under {word_limit} words.
{"Be extra concise — this is an SMS with character limits." if request.channel == Channel.SMS else ""}

## Reminder
- Output ONLY the message text, nothing else
- Follow all safety and privacy rules from your instructions
- Make it personal, warm, and human-like
"""

    return SYSTEM_PROMPT, user_prompt
