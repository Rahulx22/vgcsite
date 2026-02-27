"use client";

import { useState } from "react";
import Image from "next/image";

interface TeamMember {
  name: string;
  image: string;
  alt?: string;
  bio: string;
}

interface TeamSectionProps {
  title: string;
  members: TeamMember[];
}

export default function TeamSection({ title, members }: TeamSectionProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showModal, setShowModal] = useState(false);

  const openModal = (member: TeamMember) => {
    setSelectedMember(member);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMember(null);
  };

  return (
    <div className="team-sec">
      <h2 data-aos="fade-up" data-aos-duration="1200">{title}</h2>
      <div className="container">
        <div className="row">
          {members.map((member, index) => (
            <div key={index} className="col-lg-3 col-md-6">
              <Image
                src={member.image}
                alt={member.alt || member.name}
                title={member.alt || member.name}
                width={400}
                height={400}
                loading="lazy"
                unoptimized
              />
              <h3>{member.name}</h3>
              <a href="#" onClick={(e) => { e.preventDefault(); openModal(member); }}>
                See Bio
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedMember && (
        <div className="modal fade team-info show" style={{ display: 'block' }} id="myModal">
          <div className="modal-dialog">
            <div className="modal-content">
              <button type="button" className="close" onClick={closeModal}>×</button>
              <div className="modal-body">
                <h4>{selectedMember.name}</h4>
                <p>{selectedMember.bio}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {showModal && (
        <div className="modal-backdrop fade show" onClick={closeModal}></div>
      )}
    </div>
  );
}
