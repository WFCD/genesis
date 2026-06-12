export type LegalSection = {
  title: string;
  paragraphs?: string[];
  list?: string[];
};

export const privacyPolicy = {
  title: 'Privacy Policy',
  intro:
    'At Genesis, accessible from this site and primarily usable on Discord, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Genesis and how we use it.',
  sections: [
    {
      title: 'Consent',
      paragraphs: [
        'By using Genesis, Warframe Hub, the Genesis dashboard, or other discord bots run by Matej Voboril ("the service"), you hereby consent to our Privacy Policy and agree to its terms.',
      ],
    },
    {
      title: 'Information we collect',
      paragraphs: [
        'The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.',
        'If you contact us directly, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.',
        'When you register for an Account, we may ask for your contact information, including items such as name, company name, address, email address, and telephone number.',
      ],
    },
    {
      title: 'How we use your information',
      paragraphs: ['We use the information we collect in various ways, including to:'],
      list: [
        'Provide, operate, and maintain the service',
        'Improve, personalize, and expand the service',
        'Understand and analyze how you use the service',
        'Develop new products, services, features, and functionality',
        'Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes',
        'Send you emails',
        'Find and prevent fraud',
      ],
    },
    {
      title: 'Log Files',
      paragraphs: [
        "Genesis follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.",
      ],
    },
    {
      title: 'Advertising Partners Privacy Policies',
      paragraphs: [
        "Third-party ad servers or ad networks uses technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on Genesis, which are sent directly to users' browser. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on websites that you visit.",
        'Note that Genesis has no access to or control over these cookies that are used by third-party advertisers.',
      ],
    },
    {
      title: 'Third Party Privacy Policies',
      paragraphs: [
        "Genesis's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information.",
        'You can choose to disable cookies through your individual browser options.',
      ],
    },
    {
      title: 'CCPA Privacy Rights (Do Not Sell My Personal Information)',
      paragraphs: [
        'Under the CCPA, among other rights, California consumers have the right to request disclosure, deletion, or opt-out of sale of personal data. If you make a request, we have one month to respond to you.',
      ],
    },
    {
      title: 'GDPR Data Protection Rights',
      paragraphs: [
        'Every user is entitled to access, rectification, erasure, restriction, objection, and data portability regarding personal data we hold, subject to applicable law. If you make a request, we have one month to respond to you.',
      ],
    },
    {
      title: "Children's Information",
      paragraphs: [
        'Genesis does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you think that your child provided this kind of information on the service, we strongly encourage you to contact us immediately and we will do our best efforts to promptly remove such information from our records.',
      ],
    },
  ] satisfies LegalSection[],
};

export const termsOfService = {
  title: 'Terms of Service',
  intro: 'Website Terms and Conditions of Use',
  sections: [
    {
      title: '1. Terms',
      paragraphs: [
        'By accessing this Website, accessible from https://genesis.warframestat.us, you are agreeing to be bound by these Website Terms and Conditions of Use and agree that you are responsible for the agreement with any applicable local laws. If you disagree with any of these terms, you are prohibited from accessing this site. The materials contained in this Website are protected by copyright and trade mark law.',
      ],
    },
    {
      title: '2. Use License',
      paragraphs: [
        "Permission is granted to temporarily download one copy of the materials on Matej Voboril's Website for personal, non-commercial transitory viewing only. Under this license you may not:",
      ],
      list: [
        'modify or copy the materials;',
        'use the materials for any commercial purpose or for any public display;',
        "attempt to reverse engineer any software contained on Matej Voboril's Website;",
        'remove any copyright or other proprietary notations from the materials; or',
        'transfer the materials to another person or "mirror" the materials on any other server.',
      ],
    },
    {
      title: '3. Disclaimer',
      paragraphs: [
        'All the materials on Matej Voboril\'s Website are provided "as is". Matej Voboril makes no warranties, may it be expressed or implied, therefore negates all other warranties.',
      ],
    },
    {
      title: '4. Limitations',
      paragraphs: [
        "Matej Voboril or its suppliers will not be hold accountable for any damages that will arise with the use or inability to use the materials on Matej Voboril's Website.",
      ],
    },
    {
      title: '5. Revisions and Errata',
      paragraphs: [
        "The materials appearing on Matej Voboril's Website may include technical, typographical, or photographic errors. Matej Voboril may change the materials contained on its Website at any time without notice.",
      ],
    },
    {
      title: '6. Links',
      paragraphs: [
        'Matej Voboril has not reviewed all of the sites linked to its Website and is not responsible for the contents of any such linked site.',
      ],
    },
    {
      title: '7. Site Terms of Use Modifications',
      paragraphs: [
        'Matej Voboril may revise these Terms of Use for its Website at any time without prior notice. By using this Website, you are agreeing to be bound by the current version of these Terms and Conditions of Use.',
      ],
    },
    {
      title: '8. Your Privacy',
      paragraphs: ['Please read our Privacy Policy.'],
    },
    {
      title: '9. Governing Law',
      paragraphs: [
        'Any claim related to the service shall be governed by the laws of the United States of America without regards to its conflict of law provisions.',
      ],
    },
  ] satisfies LegalSection[],
};
